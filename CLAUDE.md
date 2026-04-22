# Project Instructions — Sha'lelha (شعللها)

## Mandatory Skills

Five skills are installed in `.agents/skills/`. **All GSD agents (researcher, planner, executor, reviewer) MUST invoke the relevant skills before and after their work.** These are not optional.

### Skill → Domain Mapping

| Skill | Invoke When |
|---|---|
| `next-best-practices` | Any Next.js work: pages, routing, RSC, data fetching, metadata, fonts, images, bundling, hydration |
| `nodejs-backend-patterns` | Any Node.js/backend work: APIs, services, middleware, auth, database access, error handling |
| `senior-devops` | Any deployment/infra work: Railway, Vercel, Docker, CI/CD, environment variables, secrets, pipelines |
| `ui-ux-pro-max` | Any UI/UX work: component design, layouts, design system, accessibility, responsive design |
| `webapp-testing` | Any testing work: unit tests, integration tests, E2E tests, test strategy |

### Invocation Rules

1. **Planner agents**: Invoke all relevant skills BEFORE writing PLAN.md. Let the skills shape task design.
2. **Researcher agents**: Invoke all relevant skills BEFORE writing RESEARCH.md. Skills inform what to look up.
3. **Executor agents**: Invoke relevant skills at the START of each wave before writing any code.
4. **Reviewer agents**: Invoke all relevant skills when reviewing output. Use skill standards as the review criteria.

If a phase touches multiple domains (e.g. a feature with frontend + backend + tests), invoke ALL matching skills.

---

## Post-Wave Feedback (MANDATORY)

After **every wave** in GSD execution, the executor MUST:

1. Identify which skills are relevant to what was just built in that wave.
2. Invoke each relevant skill.
3. Output a **Wave Feedback Report** using this format:

```
## Wave [N] Feedback

### next-best-practices
[Findings from the skill's lens — what was done correctly, what violated the skill's standards, what should be fixed]

### nodejs-backend-patterns
[Same]

### senior-devops
[Same — only if deployment/infra was touched]

### ui-ux-pro-max
[Same — only if UI was touched]

### webapp-testing
[Same — only if tests were written or should have been]

### Action Items
- [ ] [Any issue that must be fixed before the next wave or before phase completion]
```

This report must appear in the executor's output after each wave, before moving to the next wave. If a skill found no issues, write "No issues found." — do not skip the section.

---

## Vercel Deployment Playbook (Zain — senior-devops)

This section documents every known deployment pitfall and its fix. **Read this before every deploy.**

### Architecture

- **Monorepo**: `apps/web` (Next.js 14) + `apps/server` (Node.js/Socket.io)
- **Vercel hosts**: `apps/web` only → https://shallelha.vercel.app/
- **Railway hosts**: `apps/server` (game server)
- **Database**: PostgreSQL (NeonDB), shared by both apps
- **Vercel plan**: Hobby (free) — has size/feature limits

### Deploy Command

```bash
npx vercel deploy --prod --yes --archive=tgz
```

**`--archive=tgz` is MANDATORY** for monorepos. Without it, Vercel CLI uploads only ~673KB instead of the full ~2.7MB, causing 0ms builds that silently produce broken deploys.

### Vercel Project Settings Override vercel.json

Vercel dashboard settings **take precedence** over `vercel.json`. If `buildCommand` is set in the dashboard, `vercel.json` is ignored for that field.

- **Current correct buildCommand**: `cd apps/web && npm run build` (includes `prisma generate`)
- **Vercel project ID**: `prj_gacCC1D8acbXvRaKo1bVDuuxBENA`
- **Team ID**: `team_Q1yfVbYZWOyNoX3xPu8zTXPU`

To check/update project settings via API:

```bash
# Read current settings
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects/prj_gacCC1D8acbXvRaKo1bVDuuxBENA?teamId=team_Q1yfVbYZWOyNoX3xPu8zTXPU" | jq '.buildCommand'

# Update buildCommand
curl -s -X PATCH -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"buildCommand":"cd apps/web && npm run build"}' \
  "https://api.vercel.com/v9/projects/prj_gacCC1D8acbXvRaKo1bVDuuxBENA?teamId=team_Q1yfVbYZWOyNoX3xPu8zTXPU"
```

**Vercel auth token location (Windows)**: `%APPDATA%/com.vercel.cli/Data/auth.json`

### Known Build Errors & Fixes

| Error | Root Cause | Fix |
|---|---|---|
| Build is 0ms / site returns old code | Missing `--archive=tgz` flag | Add `--archive=tgz` to deploy command |
| `P1012: datasource url no longer supported` | `npx prisma generate` downloads latest Prisma (v7) which has breaking changes | Pin `"prisma": "^6.19.3"` in `apps/web/package.json` devDependencies to match `@prisma/client` |
| `Cannot find module '@playwright/test'` | `playwright.config.ts` matches `**/*.ts` in tsconfig include | Add `"playwright.config.ts"` to `exclude` in `apps/web/tsconfig.json` |
| `Edge Function size is X MB, limit is 1 MB` | OG image routes use `runtime = 'edge'` + Prisma (heavy) | Change to `runtime = 'nodejs'` in `apps/web/app/api/og/*/route.tsx` |
| `buildCommand` ignoring `prisma generate` | Dashboard buildCommand overrides vercel.json | Update via Vercel API (see above) or clear in dashboard |

### Build Logs When Deploy Fails

When `npx vercel logs <url>` doesn't work (deployment in error state), use the API:

```bash
# Get deployment ID from URL or list
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v2/deployments/<DEPLOYMENT_ID>/events" | jq '.[].text'
```

### Pre-Deploy Checklist

1. `apps/web/package.json` has `"prisma": "^6.19.3"` in devDependencies (must match `@prisma/client` version)
2. `apps/web/tsconfig.json` excludes test configs (`playwright.config.ts`)
3. OG image routes use `runtime = 'nodejs'` (not `'edge'`) — Hobby plan Edge limit is 1 MB
4. `vercel.json` has `"buildCommand": "cd apps/web && npm run build"` and `"installCommand": "npm install"`
5. Vercel dashboard buildCommand matches or is cleared (API check above)
6. Deploy with: `npx vercel deploy --prod --yes --archive=tgz`
7. After deploy, verify: `curl -s -o /dev/null -w '%{http_code}' https://shallelha.vercel.app/`

### Environment Variables

Managed in Vercel dashboard → Project Settings → Environment Variables. Key vars:
- `DATABASE_URL` — NeonDB PostgreSQL connection string
- `NEXTAUTH_SECRET` — NextAuth.js secret
- `NEXTAUTH_URL` — `https://shallelha.vercel.app`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth
- `NEXT_PUBLIC_SOCKET_URL` — Railway server URL for Socket.io

---

## Other Standing Instructions

- Never use `ts-node` for Docker startup scripts — compile to JS or write plain CommonJS.
- Always run E2E tests and fix failures before handing off a deployment to the user.
- Run `find-skills` before every `/gsd-plan-phase` — install relevant skills before spawning researcher/planner.
- After major milestones, generate `HANDOFF.md` at the project root.
- Never ask the user about UI/UX decisions — auto-run `gsd-ui-phase` instead.
