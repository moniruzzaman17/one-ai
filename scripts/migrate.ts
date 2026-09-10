import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

config({ path: ".env.local" });
config();

const url = process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_DIRECT_URL or DATABASE_URL is required");

async function main(){const client = neon(url!);
await migrate(drizzle({ client }), { migrationsFolder: "drizzle" }); console.log("OneAI migrations complete over Neon HTTPS");}
main().catch((error)=>{console.error(error);process.exit(1)});
