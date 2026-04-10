# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## no-approved-questions-available — Seed never ran in production; ts-node unavailable in runner stage
- **Date:** 2026-04-11
- **Error patterns:** No approved questions available, seed, ts-node not found, healthcheck failed, DEPLOYING, npm ci production
- **Root cause:** Dockerfile CMD ran seed via ts-node which (1) originally rejected prisma/seed.ts due to tsconfig rootDir mismatch, then (2) failed silently because ts-node is not reliably installed by npm ci --only=production on Node 22 alpine even when listed in dependencies.
- **Fix:** Convert prisma/seed.ts to prisma/seed.js (plain CommonJS); update CMD to `node prisma/seed.js`; add idempotency guard (question.count() check before creates); add approvedQuestions count to /health for observability.
- **Files changed:** apps/server/Dockerfile, apps/server/prisma/seed.js, apps/server/src/routes/health.ts
---

