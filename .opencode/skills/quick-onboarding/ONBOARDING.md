# Quick Onboarding Guide

One-page guide for teammates using OpenCode skills in this monorepo.

Canonical developer onboarding (non-skill doc): `documentation/onboarding.md`.

## 1) Understand the repo in 60 seconds

- Monorepo tooling: Bun workspaces + Turbo.
- `shared/`: canonical Zod contracts and shared types.
- `server/`: Hono API + Drizzle persistence.
- `client/`: React + Vite + TanStack Router.
- `automation/`: Node + Playwright workflow runner.

## 2) Read policies in order

1. `AGENTS.md`
2. `automation-context-factory/AGENTS.md`
3. `automation-context-factory/01-product-intent.md` ... `08-verification-and-dod.md`

## 3) Pick the right skill

- `skills-daily-driver`: auto-route most tasks.
- `perf-auditor`: performance triage and measurable optimization.
- `refactor-guardian`: DRY/KISS refactors with behavior preservation.
- `coder-buddy`: architecture-safe implementation and cross-layer hardening.
- `quick-onboarding`: help a teammate get started quickly.

## 4) Copy/paste prompts

```text
Use skill skills-daily-driver.
Task:
Target files/features:
Goal:
Constraints:
Mode: implement+verify
```

```text
Use skill perf-auditor.
Target flow: <path/feature>
Need: baseline metrics, bottleneck hypothesis, and 1-2 low-risk options.
Constraints: preserve API compatibility and observability.
```

```text
Use skill refactor-guardian.
Target: <path/feature>
Goal: reduce duplication and simplify branching while keeping behavior unchanged.
```

```text
Use skill coder-buddy.
Implement approved changes safely across layers.
Constraints: shared contracts first, no breaking endpoint paths, keep Zod at boundaries.
```

## 5) Verification baseline

Run from repo root unless scope is narrower:

- `bun run type-check`
- `bun run build`
- `bun run test`
- if automation changed: `bun run --cwd automation typecheck`

## 6) Team guardrails

- Prefer additive schema changes in `shared`.
- Preserve active endpoint and response compatibility.
- Keep route files thin; keep client render components focused.
- Keep automation status transitions explicit with actionable failure context.
- Never hardcode secrets or commit sensitive auth state.
