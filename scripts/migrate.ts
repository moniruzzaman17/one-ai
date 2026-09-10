import postgres from "postgres";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

config({ path: ".env.local" });
config();

const url = process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_DIRECT_URL or DATABASE_URL is required");

async function main(){const client = postgres(url!, { max: 1, prepare: false });
try { await migrate(drizzle(client), { migrationsFolder: "drizzle" }); console.log("OneAI migrations complete"); }
finally { await client.end(); }}
main().catch((error)=>{console.error(error);process.exit(1)});
