import { existsSync } from "node:fs";
import { config } from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const environmentFile = process.env.ONEAI_ENV_FILE ?? ".env.local";
if (existsSync(environmentFile)) config({ path: environmentFile });
config();

const url = process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_DIRECT_URL or DATABASE_URL is required");

const client = postgres(url, { max: 1, prepare: false });
try {
  await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  console.log("OneAI migrations complete");
} finally {
  await client.end();
}
