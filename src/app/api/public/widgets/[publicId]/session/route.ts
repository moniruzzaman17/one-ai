import { and,eq,gt,sql } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import { db } from "@/db";
import { calls } from "@/db/schema";
import { GEMINI_LIVE_MODEL,MAX_CALL_SECONDS } from "@/lib/constants";
import { buildLiveConfig,buildRawLiveSetup } from "@/lib/live-config";
import { getClientIpHash,jsonError } from "@/lib/request-security";
import { getGeminiKey } from "@/lib/settings";
import { loadPublicWidget } from "@/lib/widget-access";
import { corsHeaders,signWidgetToken } from "@/lib/widget-token";

export async function POST(request:Request,{params}:{params:Promise<{publicId:string}>}){
  const{publicId}=await params;const result=await loadPublicWidget(publicId,request);if(!result)return jsonError("Widget unavailable for this domain",403);const headers=corsHeaders(result.origin);const body=await request.json().catch(()=>({}));
  if(result.widget.recordingEnabled&&body.recordingConsent!==true)return Response.json({ok:false,error:"Recording consent is required"},{status:422,headers});
  const ipHash=getClientIpHash(request);const[{count}]=await db.select({count:sql<number>`count(*)::int`}).from(calls).where(and(eq(calls.widgetId,result.widget.id),eq(calls.ipHash,ipHash),gt(calls.createdAt,new Date(Date.now()-60*60_000))));if(count>=12)return Response.json({ok:false,error:"Call limit reached. Try again later."},{status:429,headers});
  const active=await db.select({id:calls.id}).from(calls).where(and(eq(calls.widgetId,result.widget.id),eq(calls.ipHash,ipHash),sql`${calls.status} in ('connecting','active')`,gt(calls.lastActivityAt,new Date(Date.now()-4*60_000)))).limit(1);if(active.length)return Response.json({ok:false,error:"A call is already active in this browser"},{status:409,headers});
  const key=await getGeminiKey();if(!key)return Response.json({ok:false,error:"Voice provider is not configured"},{status:503,headers});const config=buildLiveConfig(result.agent,result.fields);const ai=new GoogleGenAI({apiKey:key,httpOptions:{apiVersion:"v1beta"}});let ephemeral;
  try{ephemeral=await ai.authTokens.create({config:{uses:1,newSessionExpireTime:new Date(Date.now()+60_000).toISOString(),expireTime:new Date(Date.now()+MAX_CALL_SECONDS*1000).toISOString(),liveConnectConstraints:{model:GEMINI_LIVE_MODEL,config}}})}catch(error){return Response.json({ok:false,error:"Gemini Live is unavailable",details:error instanceof Error?error.message:undefined},{status:503,headers})}
  const[call]=await db.insert(calls).values({widgetId:result.widget.id,agentId:result.agent.id,status:"connecting",origin:result.origin,ipHash,language:result.agent.language,recordingConsent:body.recordingConsent===true}).returning();const token=await signWidgetToken({callId:call.id,widgetId:result.widget.id,agentId:result.agent.id,origin:result.origin});
  return Response.json({ok:true,callId:call.id,sessionToken:token,ephemeralToken:ephemeral.name,websocketUrl:`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(ephemeral.name??"")}`,model:GEMINI_LIVE_MODEL,setup:buildRawLiveSetup(GEMINI_LIVE_MODEL,config),maxCallSeconds:MAX_CALL_SECONDS,idleSeconds:Number(process.env.CALL_IDLE_SECONDS??180)},{headers});
}
export async function OPTIONS(request:Request){return new Response(null,{status:204,headers:corsHeaders(request.headers.get("origin")??"*")})}
