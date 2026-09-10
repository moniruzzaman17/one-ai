import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  customType,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const vector = customType<{
  data: number[];
  driverData: string;
  config: { dimensions?: number };
}>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 768})`;
  },
  toDriver(value) {
    return `[${value.join(",")}]`;
  },
  fromDriver(value) {
    return value.slice(1, -1).split(",").map(Number);
  },
});

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  mustChangePassword: boolean("must_change_password").default(true).notNull(),
  failedLogins: integer("failed_logins").default(0).notNull(),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [uniqueIndex("admins_email_unique").on(table.email)]);

export const adminSessions = pgTable("admin_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: uuid("admin_id").notNull().references(() => admins.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  csrfHash: text("csrf_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("admin_sessions_admin_idx").on(table.adminId), uniqueIndex("admin_sessions_token_unique").on(table.tokenHash)]);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().default({}).notNull(),
  encryptedValue: text("encrypted_value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  language: text("language").default("bilingual").notNull(),
  voiceName: text("voice_name").default("Kore").notNull(),
  voiceGender: text("voice_gender").default("female").notNull(),
  tone: text("tone").default("helpful and professional").notNull(),
  greeting: text("greeting").default("Hello! How can I help you today?").notNull(),
  systemPrompt: text("system_prompt").default("").notNull(),
  active: boolean("active").default(true).notNull(),
  ...timestamps,
});

export const agentLeadFields = pgTable("agent_lead_fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  fieldKey: text("field_key").notNull(),
  label: text("label").notNull(),
  type: text("type").notNull(),
  required: boolean("required").default(false).notNull(),
  options: jsonb("options").$type<string[]>().default([]).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
}, (table) => [uniqueIndex("agent_lead_field_key_unique").on(table.agentId, table.fieldKey)]);

export const knowledgeSources = pgTable("knowledge_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  originalName: text("original_name"),
  mimeType: text("mime_type"),
  storagePath: text("storage_path"),
  sourceUrl: text("source_url"),
  crawlDepth: integer("crawl_depth").default(3).notNull(),
  status: text("status").default("queued").notNull(),
  progress: integer("progress").default(0).notNull(),
  error: text("error"),
  pageCount: integer("page_count").default(0).notNull(),
  chunkCount: integer("chunk_count").default(0).notNull(),
  contentHash: text("content_hash"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  lastProcessedAt: timestamp("last_processed_at", { withTimezone: true }),
  ...timestamps,
});

export const knowledgeChunks = pgTable("knowledge_chunks", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  sourceId: uuid("source_id").notNull().references(() => knowledgeSources.id, { onDelete: "cascade" }),
  pageUrl: text("page_url"),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  contentHash: text("content_hash").notNull(),
  tokenCount: integer("token_count").notNull(),
  embedding: vector("embedding", { dimensions: 768 }).notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("knowledge_chunks_source_idx").on(table.sourceId)]);

export const agentKnowledgeSources = pgTable("agent_knowledge_sources", {
  agentId: uuid("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  sourceId: uuid("source_id").notNull().references(() => knowledgeSources.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [primaryKey({ columns: [table.agentId, table.sourceId] })]);

export const ingestionJobs = pgTable("ingestion_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: uuid("source_id").references(() => knowledgeSources.id, { onDelete: "cascade" }),
  type: text("type").default("ingest").notNull(),
  status: text("status").default("queued").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  progress: integer("progress").default(0).notNull(),
  availableAt: timestamp("available_at", { withTimezone: true }).defaultNow().notNull(),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  error: text("error"),
  payload: jsonb("payload").$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
}, (table) => [index("ingestion_jobs_queue_idx").on(table.status, table.availableAt)]);

export const widgets = pgTable("widgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  publicId: text("public_id").notNull(),
  agentId: uuid("agent_id").notNull().references(() => agents.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  active: boolean("active").default(true).notNull(),
  avatarUrl: text("avatar_url"),
  primaryColor: text("primary_color").default("#3858F0").notNull(),
  accentColor: text("accent_color").default("#16D9C4").notNull(),
  greeting: text("greeting"),
  position: text("position").default("right").notNull(),
  recordingEnabled: boolean("recording_enabled").default(true).notNull(),
  recordingNotice: text("recording_notice").default("This call may be recorded to improve service.").notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("widgets_public_id_unique").on(table.publicId)]);

export const widgetOrigins = pgTable("widget_origins", {
  widgetId: uuid("widget_id").notNull().references(() => widgets.id, { onDelete: "cascade" }),
  origin: text("origin").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [primaryKey({ columns: [table.widgetId, table.origin] })]);

export const calls = pgTable("calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  widgetId: uuid("widget_id").notNull().references(() => widgets.id, { onDelete: "restrict" }),
  agentId: uuid("agent_id").notNull().references(() => agents.id, { onDelete: "restrict" }),
  status: text("status").default("connecting").notNull(),
  origin: text("origin").notNull(),
  ipHash: text("ip_hash"),
  language: text("language").default("bilingual").notNull(),
  recordingConsent: boolean("recording_consent").default(false).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  durationSeconds: integer("duration_seconds").default(0).notNull(),
  summary: text("summary"),
  aiCategory: text("ai_category"),
  categoryOverride: text("category_override"),
  recordingPath: text("recording_path"),
  recordingMime: text("recording_mime"),
  recordingBytes: bigint("recording_bytes", { mode: "number" }),
  recordingExpiresAt: timestamp("recording_expires_at", { withTimezone: true }),
  usage: jsonb("usage").$type<Record<string, number>>().default({}).notNull(),
  rateSnapshot: jsonb("rate_snapshot").$type<Record<string, number>>().default({}).notNull(),
  costUsd: numeric("cost_usd", { precision: 14, scale: 8 }).default("0").notNull(),
  costBdt: numeric("cost_bdt", { precision: 14, scale: 4 }).default("0").notNull(),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("calls_started_idx").on(table.startedAt), index("calls_agent_idx").on(table.agentId)]);

export const callTurns = pgTable("call_turns", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  callId: uuid("call_id").notNull().references(() => calls.id, { onDelete: "cascade" }),
  sequence: integer("sequence").notNull(),
  role: text("role").notNull(),
  text: text("text").notNull(),
  language: text("language"),
  isFinal: boolean("is_final").default(true).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("call_turn_sequence_unique").on(table.callId, table.sequence)]);

export const leadValues = pgTable("lead_values", {
  id: uuid("id").primaryKey().defaultRandom(),
  callId: uuid("call_id").notNull().references(() => calls.id, { onDelete: "cascade" }),
  fieldKey: text("field_key").notNull(),
  label: text("label").notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("lead_values_call_field_unique").on(table.callId, table.fieldKey)]);

export const workerHeartbeats = pgTable("worker_heartbeats", {
  worker: text("worker").primaryKey(),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }).defaultNow().notNull(),
  details: jsonb("details").$type<Record<string, unknown>>().default({}).notNull(),
});

export const schemaVersion = pgTable("schema_version", {
  id: integer("id").primaryKey().default(1),
  version: text("version").default(sql`'0.1.0'`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
