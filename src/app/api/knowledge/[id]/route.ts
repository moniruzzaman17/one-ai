import { unlink } from "node:fs/promises";
import { asc,eq,sql } from "drizzle-orm";
import { db } from "@/db";
import { knowledgeChunks,knowledgeSources } from "@/db/schema";
import { authorizeAdminApi } from "@/lib/auth";
import { jsonError } from "@/lib/request-security";

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const auth=await authorizeAdminApi(request);if(auth.error)return auth.error;
  const{id}=await params;
  const[source]=await db.select().from(knowledgeSources).where(eq(knowledgeSources.id,id)).limit(1);
  if(!source)return jsonError("Knowledge source not found",404);
  const rows=await db.select({url:knowledgeChunks.pageUrl,title:sql<string>`${knowledgeChunks.metadata}->>'pageTitle'`,content:knowledgeChunks.content}).from(knowledgeChunks).where(eq(knowledgeChunks.sourceId,id)).orderBy(asc(knowledgeChunks.chunkIndex)).limit(500);
  const pages=[...rows.reduce((map,row)=>{const key=row.url||row.title||"Document";const current=map.get(key);if(current)current.chunks++;else map.set(key,{url:row.url,title:row.title||"Document",chunks:1,preview:row.content.slice(0,280)});return map},new Map<string,{url:string|null;title:string;chunks:number;preview:string}>()).values()];
  return Response.json({ok:true,source,pages});
}

export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){
  const auth=await authorizeAdminApi(request,true);if(auth.error)return auth.error;
  const{id}=await params;
  const[source]=await db.delete(knowledgeSources).where(eq(knowledgeSources.id,id)).returning();
  if(!source)return jsonError("Knowledge source not found",404);
  if(source.storagePath)await unlink(source.storagePath).catch(()=>undefined);
  return Response.json({ok:true});
}
