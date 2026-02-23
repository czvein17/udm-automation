---
name: coder-buddy
description: Playbooks and rules for safe changes across BHVR monorepo (server/client/shared/automation) while preserving contracts.
compatibility: opencode
---

# SKILL.md

UDM Automation engineering skill profile tuned to this monorepo architecture.

## Goal

Deliver safe, scalable changes across `automation`, `server`, `client`, and `shared` while preserving contracts and runtime safety.

## Repo architecture map

- Monorepo tooling: Bun workspaces + Turbo.
- `shared/`: canonical Zod schemas and cross-layer types.
- `server/`: Hono routes/handlers/services + Drizzle persistence.
- `client/`: React + Vite + TanStack Router UI.
- `automation/`: Node + Playwright job runner and CLI.

### Key files to anchor changes

- `shared/src/schema/index.ts`
- `server/src/feature/automation/automation.route.ts`
- `server/src/feature/config/config.route.ts`
- `server/src/feature/task/task.route.ts`
- `automation/src/jobs/udm-automation/index.ts`
- `automation/src/cli.ts`
- `client/src/features/UDMAutomations/pages/Request.tsx`

## Load order

1. Read `AGENTS.md`.
2. Read `automation-context-factory/AGENTS.md`.
3. Load numbered policy files in order.

## Operating loop

1. Build the context brief from `automation-context-factory/02-context-factory-template.md`.
2. Identify affected layers and shared contracts.
3. Implement minimal, reversible changes.
4. Verify with checks from `automation-context-factory/08-verification-and-dod.md`.
5. Report results and remaining risks.

## Layer-aware playbook

### Shared (`shared/`)

- Define/modify cross-layer contracts in Zod first.
- Export new schemas/types centrally from `shared/src/schema/index.ts`.
- Prefer additive contract evolution and defaults over removals/renames.

### Server (`server/`)

- Keep Hono route files thin; orchestration in services/repo.
- Validate request boundaries with Zod and fail malformed input early.
- Preserve endpoint paths and response envelope semantics.

### Client (`client/`)

- Keep data-fetch/state in hooks, mapping in pure utilities, render logic in components.
- Tolerate old/new payload variants when compatibility is required.
- Avoid coupling display logic to automation internals.

### Automation (`automation/`)

- Keep CLI entrypoint at `automation/src/cli.ts` and job registration driven.
- Centralize selectors in `automation/src/selectors`.
- Emit explicit run/step/failure status with `runId`, `jobId`, and row/task context.

## Skill rules

- Contracts-first: update `shared` schema before cross-layer behavior.
- Compatibility-first: preserve active REST payload compatibility.
- Observability-first: keep run state and failure context explicit.
- Safety-first: avoid destructive defaults and never hardcode secrets.
- Scalability-first: prefer additive schema evolution, bounded memory, and testable pure utilities.

## Response format expectations

- Start with a short implementation summary and intent.
- List changed files and purpose per file.
- Note key before/after design decisions in concise terms.
- Include verification commands executed and outcomes (or exact manual checks if not run).
- Call out unresolved risks, deferred follow-up actions, and rollback notes when relevant.

## Coding Skill Layer

### Architecture Discipline

- Keep cross-layer contracts defined only in `shared`.
- Never duplicate schema types in `server` or `automation`.
- Server routes must remain thin; business logic belongs in services.
- Automation logic must remain deterministic and side-effect aware.
- Avoid circular dependencies across workspaces.
- Do not allow `client`/`automation` to write directly to DB outside server APIs.

### Type Safety

- Prefer strict TypeScript typing; avoid `any`.
- Use `import type` for type-only imports.
- Update shared Zod schema before modifying cross-layer payloads.
- Keep schema evolution additive and backward-compatible.

### Runtime Observability

- Always include `runId` and `jobId` in failure context.
- Avoid swallowing errors in production paths.
- Prefer structured status payloads at API boundaries.
- Keep run status transitions explicit and easy to trace.

### Automation Engineering

- Playwright flows must:
  - Guard against stale selectors.
  - Handle spinner/overlay race conditions.
  - Retry idempotent actions only.
- Never hardcode environment-specific URLs.
- All runtime configuration must come from context factory.

### Performance & Scalability

- Avoid unbounded arrays or payload accumulation in memory.
- Prefer pure functions for mappers/parsers.
- Avoid heavy synchronous loops inside request handlers.

### Security

- Never hardcode secrets.
- Use environment variables for API keys.
- Do not log credentials or sensitive tokens.
- Validate all external inputs at server boundary.

### Refactor Guidelines

- Preserve public API surface.
- Maintain compatibility with existing client consumers.
- Keep changes reversible when possible.

### Code Change Checklist

Before finishing a task:

- [ ] Shared contracts updated (if needed)
- [ ] Server validation updated
- [ ] Automation caller updated
- [ ] Client parser updated (if applicable)
- [ ] Runtime behavior remains coherent
- [ ] Type-check passes
- [ ] No duplicated logic introduced

## Verification commands

Run from repo root unless scope is narrower:

- `bun run build`
- `bun run type-check`
- `bun run test`

Workspace-targeted checks:

- `bun run --cwd server build`
- `bun run --cwd client lint`
- `bun run --cwd shared build`
- `bun run --cwd automation typecheck`
