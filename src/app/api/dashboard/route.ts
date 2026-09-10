import { sql } from "drizzle-orm";
import { db } from "@/db";
import { agents,calls,knowledgeSources,leadValues,widgets } from "@/db/schema";
import { authorizeAdminApi } from "@/lib/auth";

export async function GET(request:Request){const auth=await authorizeAdminApi(request);if(auth.error)return auth.error;
  const [[callStats],[agentStats],[sourceStats],[widgetStats],[leadStats],recent]=await Promise.all([
    db.select({total:sql<number>`count(*)::int`,duration:sql<number>`coalesce(sum(${calls.durationSeconds}),0)::int`,cost:sql<string>`coalesce(sum(${calls.costBdt}),0)`,completed:sql<number>`count(*) filter (where ${calls.status}='completed')::int`}).from(calls),
    db.select({total:sql<number>`count(*)::int`}).from(agents),db.select({total:sql<number>`count(*)::int`}).from(knowledgeSources),db.select({total:sql<number>`count(*)::int`}).from(widgets),db.select({total:sql<number>`count(distinct ${leadValues.callId})::int`}).from(leadValues),
    db.select({id:calls.id,status:calls.status,language:calls.language,startedAt:calls.startedAt,duration:calls.durationSeconds,summary:calls.summary,category:sql<string>`coalesce(${calls.categoryOverride},${calls.aiCategory},'Unqualified')`,cost:calls.costBdt,agent:agents.name}).from(calls).innerJoin(agents,sql`${calls.agentId}=${agents.id}`).orderBy(sql`${calls.startedAt} desc`).limit(6),
  ]);
  return Response.json({ok:true,stats:{calls:callStats.total,leads:leadStats.total,duration:callStats.duration,costBdt:Number(callStats.cost),agents:agentStats.total,sources:sourceStats.total,widgets:widgetStats.total},recent});}
