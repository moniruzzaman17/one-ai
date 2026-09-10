import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { admins, schemaVersion, settings } from "../src/db/schema";

config({ path: ".env.local" });
config();

const url = process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_DIRECT_URL or DATABASE_URL is required");
const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.INITIAL_ADMIN_PASSWORD;
if (!email || !password || password.length < 12) {
  throw new Error("INITIAL_ADMIN_EMAIL and a 12+ character INITIAL_ADMIN_PASSWORD are required");
}
const adminEmail = email;
const adminPassword = password;

async function main(){const client = neon(url!);
const database = drizzle({ client });
  const [{ count }] = await database.select({ count: sql<number>`count(*)::int` }).from(admins);
  if (count === 0) {
    await database.insert(admins).values({
      email: adminEmail,
      name: process.env.INITIAL_ADMIN_NAME ?? "OneAI Administrator",
      passwordHash: await bcrypt.hash(adminPassword, 12),
      mustChangePassword: true,
    });
    console.log("Initial OneAI administrator created; password change is required on first login");
  } else {
    console.log("Administrator already exists; seed left it unchanged");
  }
  await database.insert(schemaVersion).values({ id: 1, version: process.env.APP_VERSION ?? "0.1.0" }).onConflictDoUpdate({ target: schemaVersion.id, set: { version: process.env.APP_VERSION ?? "0.1.0", updatedAt: new Date() } });
  await database.insert(settings).values({ key: "cost", value: { usdBdt: 122, textInputPerMillionUsd: 0.5, textOutputPerMillionUsd: 2, audioInputPerMillionUsd: 3, audioOutputPerMillionUsd: 12 } }).onConflictDoNothing();}
main().catch((error)=>{console.error(error);process.exit(1)});
