import { existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const environmentFile = process.env.ONEAI_ENV_FILE ?? ".env.local";
if (existsSync(environmentFile)) config({ path: environmentFile });
config();

const url = process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_DIRECT_URL or DATABASE_URL is required");

const client = neon(url);
await migrate(drizzle({ client }), { migrationsFolder: "drizzle" });
console.log("OneAI migrations complete over Neon HTTPS");
