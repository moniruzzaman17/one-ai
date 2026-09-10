import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { createAdminSession } from "@/lib/session";
import { jsonError, validateSameOrigin } from "@/lib/request-security";

const input = z.object({ email:z.email(), password:z.string().min(1).max(256) });
export async function POST(request: Request) {
  if (!validateSameOrigin(request)) return jsonError("Invalid request origin",403);
  const parsed=input.safeParse(await request.json().catch(()=>null)); if(!parsed.success)return jsonError("Enter a valid email and password",422);
  const [admin]=await db.select().from(admins).where(eq(admins.email,parsed.data.email.trim().toLowerCase())).limit(1);
  if(!admin){await new Promise((resolve)=>setTimeout(resolve,350));return jsonError("Invalid email or password",401)}
  if(admin.lockedUntil&&admin.lockedUntil>new Date())return jsonError("Too many attempts. Try again later.",429);
  if(!(await bcrypt.compare(parsed.data.password,admin.passwordHash))){const failures=admin.failedLogins+1;await db.update(admins).set({failedLogins:failures>=5?0:failures,lockedUntil:failures>=5?new Date(Date.now()+15*60_000):null,updatedAt:new Date()}).where(eq(admins.id,admin.id));return jsonError("Invalid email or password",401)}
  await db.update(admins).set({failedLogins:0,lockedUntil:null,updatedAt:new Date()}).where(eq(admins.id,admin.id)); await createAdminSession(admin,request);
  return Response.json({ok:true,mustChangePassword:admin.mustChangePassword});
}
