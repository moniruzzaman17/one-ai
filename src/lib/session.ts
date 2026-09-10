import "server-only";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { adminSessions, admins } from "@/db/schema";
import { CSRF_COOKIE, SESSION_COOKIE } from "./constants";
import { randomToken, sha256 } from "./crypto";
import { signSession, verifySessionToken } from "./session-token";

const SESSION_SECONDS = 60 * 60 * 24 * 7;

export async function createAdminSession(admin: typeof admins.$inferSelect, request: Request) {
  const rawSession = randomToken();
  const csrf = randomToken(24);
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000);
  const userAgent = request.headers.get("user-agent")?.slice(0, 500) ?? null;
  const [record] = await db.insert(adminSessions).values({
    adminId: admin.id,
    tokenHash: sha256(rawSession),
    csrfHash: sha256(csrf),
    expiresAt,
    userAgent,
  }).returning({ id: adminSessions.id });

  const jwt = await signSession({
    adminId: admin.id,
    sessionId: `${record.id}.${rawSession}`,
    mustChangePassword: admin.mustChangePassword,
  });
  const store = await cookies();
  const secure = process.env.NODE_ENV === "production";
  store.set(SESSION_COOKIE, jwt, { httpOnly: true, secure, sameSite: "lax", path: "/", expires: expiresAt, priority: "high" });
  store.set(CSRF_COOKIE, csrf, { httpOnly: false, secure, sameSite: "strict", path: "/", expires: expiresAt, priority: "high" });
  return { expiresAt, csrf };
}

export async function getVerifiedAdmin() {
  const store = await cookies();
  const claims = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!claims) return null;
  const [sessionId, rawSession] = claims.sessionId.split(".");
  if (!sessionId || !rawSession) return null;
  const rows = await db.select({
    sessionId: adminSessions.id,
    adminId: admins.id,
    name: admins.name,
    email: admins.email,
    mustChangePassword: admins.mustChangePassword,
  }).from(adminSessions)
    .innerJoin(admins, eq(adminSessions.adminId, admins.id))
    .where(and(
      eq(adminSessions.id, sessionId),
      eq(adminSessions.tokenHash, sha256(rawSession)),
      gt(adminSessions.expiresAt, new Date()),
    )).limit(1);
  return rows[0] ?? null;
}

export async function deleteAdminSession() {
  const store = await cookies();
  const claims = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (claims) {
    const [sessionId] = claims.sessionId.split(".");
    if (sessionId) await db.delete(adminSessions).where(eq(adminSessions.id, sessionId));
  }
  store.delete(SESSION_COOKIE);
  store.delete(CSRF_COOKIE);
}

export async function verifyCsrf(request: Request) {
  const store = await cookies();
  const sessionClaims = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  const csrf = store.get(CSRF_COOKIE)?.value;
  const header = request.headers.get("x-oneai-csrf");
  if (!sessionClaims || !csrf || !header || csrf !== header) return false;
  const [sessionId] = sessionClaims.sessionId.split(".");
  const rows = await db.select({ hash: adminSessions.csrfHash }).from(adminSessions).where(eq(adminSessions.id, sessionId)).limit(1);
  return rows[0]?.hash === sha256(csrf);
}

export { verifySessionToken } from "./session-token";
