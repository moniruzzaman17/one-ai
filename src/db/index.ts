import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { oneAiSql?: ReturnType<typeof postgres> };

function connectionString() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is not configured");
  return value;
}

export const sqlClient =
  globalForDb.oneAiSql ??
  postgres(connectionString(), {
    max: process.env.NODE_ENV === "production" ? 5 : 2,
    idle_timeout: 20,
    connect_timeout: 15,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") globalForDb.oneAiSql = sqlClient;

export const db = drizzle(sqlClient, { schema });
