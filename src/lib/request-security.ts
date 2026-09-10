import { sha256 } from "./crypto";

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

export function getClientIpHash(request: Request) {
  return sha256(`${process.env.SESSION_SECRET ?? "oneai"}:${getClientIp(request)}`);
}

export function requestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) return normalizeOrigin(origin);
  const referer = request.headers.get("referer");
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export function normalizeOrigin(value: string) {
  const url = new URL(value);
  return url.origin.toLowerCase();
}

export function validateSameOrigin(request: Request) {
  const origin = requestOrigin(request);
  if (!origin) return false;
  const requestUrl = new URL(request.url);
  const allowed = new Set([
    requestUrl.origin.toLowerCase(),
    normalizeOrigin(process.env.APP_URL ?? requestUrl.origin),
  ]);
  return allowed.has(origin);
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return Response.json({ ok: false, error: message, ...(details ? { details } : {}) }, { status });
}
