# OneAI

OneAI is a lightweight, independent voice-only browser agent platform. It uses Next.js 16, TypeScript, Tailwind CSS, Drizzle ORM, Neon PostgreSQL/pgvector, and Gemini Live.

## Features

- One secure administrator with forced first-login password change.
- Multiple English, Bangla, and bilingual voice agents.
- PDF/DOCX/XLSX/TXT/CSV and safe same-origin website ingestion.
- Agent-scoped 768-dimensional vector retrieval through `search_knowledge_base`.
- Shadow DOM floating widget with Gemini ephemeral tokens, microphone streaming, barge-in, mute, transcript, explicit recording consent, and mixed WebM recording.
- Call history, lead fields, AI category, manual override, BDT cost snapshots, CSV/XLSX export, and dashboard.

## Local setup

1. Copy `.env.example` to `.env.local` and set Neon plus generated secrets.
2. Run `npm ci`, `npm run db:migrate`, and `npm run db:seed`.
3. Start with `npm run dev` and open `http://localhost:3000`.
4. Serve `test-fixture` from a second local origin and add that exact origin to the widget allowlist.

XAMPP only owns the project folder and can serve the optional fixture. PHP/Apache does not run the Next.js application.

## Background jobs

Local: `npm run worker`. Production cPanel cron (every minute):

```sh
curl --fail --silent --show-error -X POST -H "Authorization: Bearer <CRON_SECRET>" https://one.greenminds.info/api/jobs/run >/dev/null
```

The same worker handles ingestion retries, call summaries, and 90-day recording cleanup.

## Release and deployment

Development branches use `codex/*`. A reviewed release is merged to `master`, tagged with `vX.Y.Z`, then pulled in cPanel. `scripts/deploy.sh` runs install, typecheck, tests, migrations, seed, build, standalone preparation, atomic release switch, health check, and rollback.

Required cPanel environment values are documented in `.env.example`. Secrets, uploads, recordings, `.env.local`, and release output are Git-ignored.

The deployment script never guesses the subdomain document root. If an existing document root must be backed up, set `ONEAI_DOCUMENT_ROOT` to the exact absolute path shown by cPanel before running the script; otherwise leave it unset. The Node.js Application Manager owns the `one.greenminds.info` URL mapping.

For the confirmed cPanel account layout, keep the private source checkout at `/home/greenmin/repositories/one-ai`, the fixed Node.js application root at `/home/greenmin/oneai-app`, and persistent data at `/home/greenmin/oneai-data`. Run `bash scripts/deploy.sh --prepare` for the first release, create the Node.js 22 Production application with startup file `server.js`, then use `bash scripts/deploy.sh` for later releases and automatic health-check rollback.

On shared hosting that requires the application root inside `public_html`, use `public_html/repositories/one-ai` as the Node.js application root and `server.js` as the startup file. Add secrets through the cPanel application environment interface, run **Run NPM Install**, then run the `cpanel:build` package script and restart the application. Never upload an environment file into the public application root.

Alternatively, upload the complete environment file to `/home/greenmin/oneai-config/.env` with mode `600` and add only `ONEAI_ENV_FILE=/home/greenmin/oneai-config/.env` in cPanel. Both the startup server and `cpanel:build` load that private file while keeping it outside the document root.

## Security notes

- Gemini keys are encrypted with AES-256-GCM and never returned by APIs.
- Admin mutations require same-origin plus CSRF validation.
- Widget sessions enforce exact origin allowlists, short-lived signed tokens, rate limits, one active call, and Gemini model/config-bound ephemeral tokens.
- Crawler requests block private/local networks, limit redirects, pages, depth, response size, and respect `robots.txt`.
- Rotate any credential ever shared in chat after setup and live verification.
