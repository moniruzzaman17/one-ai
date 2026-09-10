import "server-only";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

const globalForDb = globalThis as unknown as { oneAiPool?: Pool };

function connectionString() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is not configured");
  return value;
}

export const dbPool =
  globalForDb.oneAiPool ??
  new Pool({
    connectionString: connectionString(),
    max: process.env.NODE_ENV === "production" ? 5 : 2,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 15_000,
  });

if (process.env.NODE_ENV !== "production") globalForDb.oneAiPool = dbPool;

export const db = drizzle({ client: dbPool, schema });
