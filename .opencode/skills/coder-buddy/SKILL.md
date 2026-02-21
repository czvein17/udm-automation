---
name: coder-buddy
description: Playbooks and rules for safe changes across BHVR monorepo (server/client/shared/automation) while preserving contracts and logs.
compatibility: opencode
---

# SKILL.md

UDM Automation Engineering Skill profile for AI agents.

## Goal

Deliver safe, scalable changes across `automation`, `server`, `client`, and `shared` while preserving contracts and log/reporting behavior.

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

## Skill rules

- Contracts-first: update `shared` schema before cross-layer behavior.
- Compatibility-first: preserve REST/WS payload compatibility for logs.
- Observability-first: emit structured reporter/log events for critical actions.
- Safety-first: avoid destructive defaults and never hardcode secrets.
- Scalability-first: prefer additive schema evolution, bounded memory, and testable pure utilities.

## Response format expectations

- Start with a short implementation summary.
- List changed files with purpose.
- Include verification commands run (or exact manual checks if not run).
- Call out any unresolved risks or follow-up actions.

## Coding Skill Layer

### Architecture Discipline

- Keep cross-layer contracts defined only in `shared`.
- Never duplicate schema types in `server` or `automation`.
- Server routes must remain thin; business logic belongs in services.
- Automation logic must remain deterministic and side-effect aware.
- Avoid circular dependencies across workspaces.

### Type Safety

- Prefer strict TypeScript typing; avoid `any`.
- Use `import type` for type-only imports.
- Update shared Zod schema before modifying cross-layer payloads.
- Keep schema evolution additive and backward-compatible.

### Logging & Observability

- Preserve existing log lifecycle:
  - `run_start`
  - `row_start`
  - `row_step`
  - `row_end`
- Always include `runId` and `jobId` in log context.
- Avoid console-only debugging in production paths.
- Structured logs > free-text logs.

### Automation Engineering

- Playwright flows must:
  - Guard against stale selectors.
  - Handle spinner/overlay race conditions.
  - Retry idempotent actions only.
- Never hardcode environment-specific URLs.
- All runtime configuration must come from context factory.

### Performance & Scalability

- Avoid unbounded arrays or log accumulation in memory.
- Use streaming (WS) for large log flows.
- Prefer pure functions for mappers/parsers.
- Avoid heavy synchronous loops inside request handlers.

### Security

- Never hardcode secrets.
- Use environment variables for API keys.
- Do not log credentials or sensitive tokens.
- Validate all external inputs at server boundary.

### Refactor Guidelines

- Preserve public API surface.
- Preserve log payload structure.
- Maintain compatibility with existing client consumers.
- Keep changes reversible when possible.

### Code Change Checklist

Before finishing a task:

- [ ] Shared contracts updated (if needed)
- [ ] Server validation updated
- [ ] Automation caller updated
- [ ] Client parser updated (if applicable)
- [ ] Logs remain backward compatible
- [ ] Type-check passes
- [ ] No duplicated logic introduced
