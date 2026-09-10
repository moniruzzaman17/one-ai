export const APP_NAME = "OneAI";
export const APP_VERSION = process.env.APP_VERSION ?? "0.1.11";
export const SESSION_COOKIE = "oneai_session";
export const CSRF_COOKIE = "oneai_csrf";
export const WIDGET_TOKEN_ISSUER = "oneai-widget";
export const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES ?? 20 * 1024 * 1024);
export const MAX_CALL_SECONDS = Number(process.env.MAX_CALL_SECONDS ?? 30 * 60);
export const CALL_IDLE_SECONDS = Number(process.env.CALL_IDLE_SECONDS ?? 3 * 60);
export const DEFAULT_CHUNK_TOKENS = 800;
export const DEFAULT_CHUNK_OVERLAP = 100;
export const EMBEDDING_DIMENSIONS = 768;

export const GEMINI_LIVE_MODEL =
  process.env.GEMINI_LIVE_MODEL ?? "gemini-3.1-flash-live-preview";
export const GEMINI_SUMMARY_MODEL = process.env.GEMINI_SUMMARY_MODEL ?? "gemini-2.5-flash";
export const GEMINI_EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-2";

export const LEAD_CATEGORIES = ["Hot", "Warm", "Cold", "Unqualified"] as const;
export type LeadCategory = (typeof LEAD_CATEGORIES)[number];
