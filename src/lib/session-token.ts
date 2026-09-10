import { SignJWT, jwtVerify } from "jose";

const SESSION_SECONDS = 60 * 60 * 24 * 7;

function signingKey() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
  return new TextEncoder().encode(value);
}

export type SessionClaims = {
  adminId: string;
  sessionId: string;
  mustChangePassword: boolean;
};

export async function signSession(claims: SessionClaims) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .setIssuer("oneai-admin")
    .setAudience("oneai-dashboard")
    .sign(signingKey());
}

export async function verifySessionToken(token?: string | null): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const result = await jwtVerify(token, signingKey(), {
      issuer: "oneai-admin",
      audience: "oneai-dashboard",
    });
    const payload = result.payload as Partial<SessionClaims>;
    if (!payload.adminId || !payload.sessionId) return null;
    return payload as SessionClaims;
  } catch {
    return null;
  }
}
