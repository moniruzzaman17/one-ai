# Changelog

All notable changes follow Semantic Versioning.

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
