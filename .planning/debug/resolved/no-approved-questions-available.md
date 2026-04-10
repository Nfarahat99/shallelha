---
status: resolved
trigger: "Game start fails with 'No approved questions available' because the seed never runs in production due to a tsconfig rootDir rejection of prisma/seed.ts"
created: 2026-04-11T00:00:00Z
updated: 2026-04-11T01:00:00Z
---

## Current Focus

hypothesis: CONFIRMED AND RESOLVED — seed.js deployed, 30 approved questions seeded
test: curl /health returned approvedQuestions:30; logs show "Seed complete: 3 categories, 30 questions"
expecting: game:start now works
next_action: archive session

## Symptoms

expected: Starting a game as host should load 30 approved questions from the DB
actual: Socket emits `room:error` with "No approved questions available" immediately on game:start
errors: [Host] Socket error: No approved questions available
reproduction: Create room → click start game → error
started: Consistent in production (Railway); never worked in prod

## Eliminated

- hypothesis: Questions created but status not 'approved'
  evidence: Seed explicitly sets `status: 'approved'` on all 30 questions
  timestamp: 2026-04-11T00:00:00Z

- hypothesis: Game engine query filtering wrong status field
  evidence: Root cause confirmed to be seed not running at all, not a query issue
  timestamp: 2026-04-11T00:00:00Z

- hypothesis: ts-node --transpile-only --skip-project would reliably run seed
  evidence: ts-node not found in runner stage (npm ci --only=production doesn't install it reliably on Node 22 / newer npm). All deployments using ts-node approach failed with "sh: node_modules/.bin/ts-node: not found"
  timestamp: 2026-04-11T01:00:00Z

## Evidence

- timestamp: 2026-04-11T00:00:00Z
  checked: apps/server/Dockerfile CMD line 35
  found: Was running `ts-node --project tsconfig.json prisma/seed.ts`; tsconfig.json has `"rootDir": "./src"` which rejects prisma/seed.ts (outside rootDir)
  implication: Seed silently fails on every Railway deploy — DB stays empty

- timestamp: 2026-04-11T00:00:00Z
  checked: apps/server/prisma/seed.ts — question creation loop
  found: Used `prisma.question.create()` with no existence check — re-runs on every deploy causing duplicates (though in practice never ran due to tsconfig bug)
  implication: If tsconfig bug fixed without idempotency guard, repeated deploys would accumulate duplicate questions

- timestamp: 2026-04-11T00:00:00Z
  checked: apps/server/prisma/seed.ts lines 25-30 (fixed version)
  found: `question.count()` guard added — if existingCount > 0, skip creation and return
  implication: Fix 2 is correct and idempotent

- timestamp: 2026-04-11T00:30:00Z
  checked: Railway deployment list after multiple railway up attempts
  found: Only ONE successful deployment (eb65ea67 at 23:36). All subsequent deploys show FAILED status despite build logs showing healthcheck success
  implication: Build logs were misleading — actual container runtime was failing after healthcheck window

- timestamp: 2026-04-11T00:35:00Z
  checked: Runtime logs for failed deployment 9427780c
  found: "sh: node_modules/.bin/ts-node: not found" — ts-node not available in production runner stage
  implication: npm ci --only=production does not install ts-node on Node 22 alpine even though it's listed in package.json dependencies. The single success (eb65ea67) must have hit a cached layer that included ts-node.

- timestamp: 2026-04-11T01:00:00Z
  checked: curl https://shallelha-server-production.up.railway.app/health after deploying seed.js
  found: {"status":"ok","postgres":"ok","approvedQuestions":30,"redis":"ok"}
  implication: 30 approved questions are in the DB; seed ran successfully with node prisma/seed.js

- timestamp: 2026-04-11T01:00:00Z
  checked: Railway runtime logs after seed.js deployment
  found: "Seed complete: 3 categories, 30 questions" followed by "[Server] Listening on port 4000"
  implication: Seed executed and seeded DB; server started; fix fully verified

## Resolution

root_cause: Three compounding bugs: (1) Original Dockerfile CMD used ts-node --project tsconfig.json which rejected prisma/seed.ts due to rootDir mismatch. (2) Fix attempt used ts-node --transpile-only --skip-project but ts-node is not reliably available in the production runner stage (npm ci --only=production on Node 22 does not install it). (3) Seed had no idempotency guard (create() without count() check).
fix: (1) Converted prisma/seed.ts to prisma/seed.js (plain CommonJS, no TypeScript). (2) Updated Dockerfile CMD to use `node prisma/seed.js` — zero runtime dependencies beyond node itself. (3) Idempotency guard (question.count() check) kept from previous fix. (4) Added approvedQuestions count to /health endpoint for ongoing observability.
verification: curl /health returns approvedQuestions:30. Railway runtime logs show "Seed complete: 3 categories, 30 questions". Deployment 9f77139b shows SUCCESS status.
files_changed:
  - apps/server/Dockerfile
  - apps/server/prisma/seed.js
  - apps/server/src/routes/health.ts
