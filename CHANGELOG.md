# Changelog

All notable changes follow Semantic Versioning.

## 0.1.13 — 2026-09-11

- Enforced the Gemini Live handshake order so microphone audio cannot be sent before `setupComplete`.
- Let the agent speak its configured greeting before enabling visitor audio, preventing immediate VAD/barge-in cancellation.
- Started call recording only after Gemini confirms the live session.
- Added handshake timeout, WebSocket close-code diagnostics, reliable media cleanup and visible connection errors.
- Forced the public embed script to revalidate so deployed widget fixes are not hidden by a stale browser cache.

## 0.1.12 — 2026-09-11

- Enabled Next.js Webpack memory optimizations for the SWC WebAssembly build path used by older shared-hosting systems.
- Bounded the cPanel build heap and disabled build telemetry to reduce peak resource use under LVE limits.

## 0.1.11 — 2026-09-11

- Sent every knowledge chunk as a separate Gemini Embedding 2 content object so vector counts match chunk counts.
- Enforced retry availability and atomic job claiming to prevent the same failed job from being retried repeatedly in one cron request.

## 0.1.10 — 2026-09-11

- Limited Next.js production type checking to application code so production-only cPanel installs do not require Vitest or Drizzle Kit.

## 0.1.9 — 2026-09-11

- Forced cPanel production builds to use Webpack so Next.js can build with its SWC WebAssembly fallback on older shared-hosting GLIBC versions.

## 0.1.8 — 2026-09-11

- Switched production database migrations and seeding from PostgreSQL TCP to Neon HTTPS for shared hosts that block outbound port 5432.
- Switched the application database runtime to Neon WebSockets over port 443 while preserving interactive transaction support.

## 0.1.7 — 2026-09-11

- Removed `tsx` and its WebAssembly parser from every cPanel build step to stay within shared-hosting LVE memory limits.
- Added plain Node migration, seed and standalone-preparation scripts for production deployment.

## 0.1.6 — 2026-09-11

- Added private external environment-file loading for cPanel runtime and build processes.
- Replaced the cPanel build shell chain with a Node runner that preserves the loaded environment across migrations and build steps.
- Ignored Passenger-generated runtime files in the source checkout.

## 0.1.5 — 2026-09-11

- Made the cPanel build script independent of nested `npm` commands in the restricted application runner.
- Promoted the required production-build toolchain so cPanel Production installs retain the executables needed to build.

## 0.1.4 — 2026-09-11

- Added a first-install bootstrap HTTP response so cPanel can verify the Passenger application before the production build exists.

## 0.1.3 — 2026-09-11

- Added a repository-root Passenger startup file for cPanel application roots inside `public_html`.
- Added a cPanel UI build script covering migrations, initial seed, production build and standalone preparation.

## 0.1.2 — 2026-09-11

- Added a stable cPanel Passenger launcher with an atomic `current` release link.
- Added a safe first-deployment preparation mode while keeping the application root fixed.
- Hardened private production-data directory permissions and documented the confirmed hosting layout.

## 0.1.1 — 2026-09-10

- Updated Gemini Live to the current v1beta constrained WebSocket protocol and Gemini 3.1 Flash Live model.
- Corrected raw Live setup mapping, ephemeral-token field masks, session resumption and recording finalization.
- Hardened widget origin binding, call detail audio state and multi-call lead exports.
- Made production builds and the cron worker reliable on memory-constrained shared hosting.
- Removed the guessed cPanel document-root path from deployment and made legacy-root backup explicit.

## 0.1.0 — 2026-09-10

- Initial OneAI single-admin browser voice platform.
- Added agent, knowledge, widget, call, lead, recording and cost workflows.
- Added Gemini Live ephemeral-token transport and agent-scoped pgvector RAG.
- Added cPanel standalone deployment and rollback flow.
