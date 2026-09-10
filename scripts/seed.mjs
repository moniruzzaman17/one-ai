import { existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

const environmentFile = process.env.ONEAI_ENV_FILE ?? ".env.local";
if (existsSync(environmentFile)) config({ path: environmentFile });
config();

const url = process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_DIRECT_URL or DATABASE_URL is required");
const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.INITIAL_ADMIN_PASSWORD;
if (!email || !password || password.length < 12) {
  throw new Error("INITIAL_ADMIN_EMAIL and a 12+ character INITIAL_ADMIN_PASSWORD are required");
}

const client = neon(url);
const [{ count }] = await client`select count(*)::int as count from admins`;
if (count === 0) {
  const passwordHash = await bcrypt.hash(password, 12);
  await client`insert into admins (name, email, password_hash, must_change_password)
    values (${process.env.INITIAL_ADMIN_NAME ?? "OneAI Administrator"}, ${email}, ${passwordHash}, true)`;
  console.log("Initial OneAI administrator created; password change is required on first login");
} else {
  console.log("Administrator already exists; seed left it unchanged");
}

const version = process.env.APP_VERSION ?? "0.1.0";
await client`insert into schema_version (id, version) values (1, ${version})
  on conflict (id) do update set version = excluded.version, updated_at = now()`;
const cost = JSON.stringify({
  usdBdt: 122,
  textInputPerMillionUsd: 0.5,
  textOutputPerMillionUsd: 2,
  audioInputPerMillionUsd: 3,
  audioOutputPerMillionUsd: 12,
});
await client`insert into settings (key, value) values ('cost', ${cost}::jsonb) on conflict (key) do nothing`;
