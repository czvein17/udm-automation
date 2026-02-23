# Developer Onboarding

This guide is for human contributors. It is separate from OpenCode skill files.

For AI skill usage, see `.opencode/skills/quick-onboarding/ONBOARDING.md`.

## 1) What this repo is

`udm-automation` is a Bun/Turbo monorepo with four layers:

- `shared/`: canonical Zod contracts and cross-layer types.
- `server/`: Hono API + orchestration + Drizzle persistence.
- `client/`: React + Vite + TanStack Router UI.
- `automation/`: Node + Playwright runner.

## 2) First-time setup

From repo root:

```bash
bun install
```

Run locally:

```bash
bun run dev
```

Or run services separately:

```bash
bun run dev:server
bun run dev:client
```

## 3) Read these docs in order

1. `AGENTS.md`
2. `automation-context-factory/AGENTS.md`
3. `automation-context-factory/01-product-intent.md` to `automation-context-factory/08-verification-and-dod.md`
4. `documentation/api-endpoints.md`
5. `documentation/automation-terminal-how-it-works.md`

## 4) Engineering guardrails

- Keep shared contracts in `shared/src/schema` first.
- Preserve active API compatibility (`ApiResponse<T>` conventions where used).
- Keep route handlers thin; put orchestration/business logic in services/repo.
- Keep client data/state in hooks and mapping in pure utilities.
- Do not bypass server APIs for DB writes from `client` or `automation`.
- Never hardcode secrets or log sensitive tokens.

## 5) Change workflow

Before coding, capture this brief in notes:

```md
Task:
Affected layers: [automation|server|client|shared]
Primary contracts touched:
Runtime impact:
Risk level: [low|medium|high]
Verification plan:
Rollback plan:
```

Then implement minimal, reversible slices and verify after each meaningful change.

## 6) Verification baseline

Run from repo root unless scope is narrower:

```bash
bun run build
bun run type-check
bun run test
```

If automation changed:

```bash
bun run --cwd automation typecheck
```

## 7) Optional: OpenCode skills (for AI-assisted work)

- `skills-daily-driver`: routes work to the right skill path.
- `perf-auditor`: performance triage and measurable optimization.
- `refactor-guardian`: DRY/KISS maintainable refactors.
- `coder-buddy`: architecture-safe cross-layer implementation.
- `quick-onboarding`: quick teammate ramp-up prompts.

## 8) Good first tasks for new contributors

- Add or tighten input validation in one route boundary with shared schema.
- Remove one duplicated mapper/helper while preserving behavior.
- Improve one high-volume UI list path (render performance) with measurements.
