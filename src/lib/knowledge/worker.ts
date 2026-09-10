import "server-only";
import { unlink } from "node:fs/promises";
import { and,asc,eq,lt,lte,or,sql } from "drizzle-orm";
import { db } from "@/db";
import { calls,ingestionJobs,knowledgeChunks,knowledgeSources,workerHeartbeats } from "@/db/schema";
import { embedTexts } from "@/lib/gemini";
import { summarizeCall } from "@/lib/calls/summary";
import { chunkText } from "./chunk";
import { crawlWebsite } from "./crawler";
import { parseDocument } from "./parser";

export async function processNextJob(){
  const now=new Date();
  const staleBefore=new Date(now.getTime()-10*60_000);
  const eligible=and(sql`${ingestionJobs.attempts}<5`,lte(ingestionJobs.availableAt,now),or(eq(ingestionJobs.status,"queued"),and(eq(ingestionJobs.status,"processing"),lt(ingestionJobs.lockedAt,staleBefore))));
  const [job]=await db.select().from(ingestionJobs).where(eligible).orderBy(asc(ingestionJobs.availableAt)).limit(1);
  if(!job){await cleanupExpiredRecordings();await heartbeat("idle");return null}
  const claimed=await db.update(ingestionJobs).set({status:"processing",lockedAt:now,attempts:job.attempts+1,updatedAt:now}).where(and(eq(ingestionJobs.id,job.id),eligible)).returning();
  if(!claimed.length)return null;
  try{
    if(job.type==="summarize"){
      const callId=String(job.payload.callId??"");if(!callId)throw new Error("Summary job has no call ID");
      await summarizeCall(callId);
      await db.update(ingestionJobs).set({status:"completed",progress:100,completedAt:new Date(),lockedAt:null,updatedAt:new Date()}).where(eq(ingestionJobs.id,job.id));
      await heartbeat("summarized");return{id:job.id,status:"completed"};
    }
    if(!job.sourceId)throw new Error("Knowledge job has no source");
    const[source]=await db.select().from(knowledgeSources).where(eq(knowledgeSources.id,job.sourceId)).limit(1);if(!source)throw new Error("Knowledge source was deleted");
    await db.update(knowledgeSources).set({status:"processing",progress:10,error:null,updatedAt:new Date()}).where(eq(knowledgeSources.id,source.id));
    const pages=source.kind==="website"?await crawlWebsite(source.sourceUrl!,Math.min(5,Math.max(1,source.crawlDepth)),100):[{url:"",title:source.title,text:await parseDocument(source.storagePath!,source.originalName!),hash:""}];
    const chunks=pages.flatMap(page=>chunkText(page.text).map(chunk=>({...chunk,pageUrl:page.url||null,metadata:{pageTitle:page.title}})));if(!chunks.length)throw new Error("No readable text was found");
    await db.update(knowledgeSources).set({progress:45,pageCount:pages.length,updatedAt:new Date()}).where(eq(knowledgeSources.id,source.id));
    const vectors:number[][]=[];for(let i=0;i<chunks.length;i+=20){vectors.push(...await embedTexts(chunks.slice(i,i+20).map(c=>c.content)));await db.update(knowledgeSources).set({progress:Math.min(90,45+Math.round(((i+20)/chunks.length)*45)),updatedAt:new Date()}).where(eq(knowledgeSources.id,source.id))}
    if(vectors.length!==chunks.length)throw new Error("Embedding count did not match chunk count");
    await db.transaction(async tx=>{await tx.delete(knowledgeChunks).where(eq(knowledgeChunks.sourceId,source.id));for(let i=0;i<chunks.length;i+=100)await tx.insert(knowledgeChunks).values(chunks.slice(i,i+100).map((c,j)=>({...c,sourceId:source.id,embedding:vectors[i+j]})));await tx.update(knowledgeSources).set({status:"ready",progress:100,chunkCount:chunks.length,lastProcessedAt:new Date(),updatedAt:new Date()}).where(eq(knowledgeSources.id,source.id));await tx.update(ingestionJobs).set({status:"completed",progress:100,completedAt:new Date(),lockedAt:null,updatedAt:new Date()}).where(eq(ingestionJobs.id,job.id))});
    await heartbeat("processed");return{id:job.id,status:"completed"};
  }catch(error){const message=error instanceof Error?error.message:"Unknown job error";const retry=job.attempts+1<5;await db.update(ingestionJobs).set({status:retry?"queued":"failed",error:message,lockedAt:null,availableAt:new Date(Date.now()+Math.min(30,2**job.attempts)*60_000),updatedAt:new Date()}).where(eq(ingestionJobs.id,job.id));if(job.sourceId)await db.update(knowledgeSources).set({status:retry?"queued":"failed",error:message,updatedAt:new Date()}).where(eq(knowledgeSources.id,job.sourceId));await heartbeat("failed");return{id:job.id,status:"failed",error:message}}
}
async function heartbeat(state:string){await db.insert(workerHeartbeats).values({worker:"ingestion",lastRunAt:new Date(),details:{state}}).onConflictDoUpdate({target:workerHeartbeats.worker,set:{lastRunAt:new Date(),details:{state}}})}
async function cleanupExpiredRecordings(){const expired=await db.select({id:calls.id,path:calls.recordingPath}).from(calls).where(and(sql`${calls.recordingPath} is not null`,lt(calls.recordingExpiresAt,new Date()))).limit(100);for(const item of expired){if(item.path)await unlink(item.path).catch(()=>undefined);await db.update(calls).set({recordingPath:null,recordingBytes:null,recordingMime:null,updatedAt:new Date()}).where(eq(calls.id,item.id))}}
