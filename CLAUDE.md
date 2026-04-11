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

## Other Standing Instructions

- Never use `ts-node` for Docker startup scripts — compile to JS or write plain CommonJS.
- Always run E2E tests and fix failures before handing off a deployment to the user.
- Run `find-skills` before every `/gsd-plan-phase` — install relevant skills before spawning researcher/planner.
- After major milestones, generate `HANDOFF.md` at the project root.
- Never ask the user about UI/UX decisions — auto-run `gsd-ui-phase` instead.
