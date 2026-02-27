---
name: perf-auditor
description: Performance triage and optimization planning for Hono, React+Vite, and Playwright with measurable outcomes.
compatibility: opencode
---

# SKILL.md

Performance-first skill profile for AI agents working in this repository.

## Goal

Find meaningful bottlenecks, propose low-risk optimizations, and validate gains with clear metrics.

## Scope

- Hono server request paths and data access.
- React + Vite rendering and bundle behavior.
- Playwright automation runtime and stability/perf tradeoffs.

## Audit operating loop

1. Capture performance checklist baseline for the target flow.
2. Reproduce representative workload and collect simple metrics.
3. Identify top bottleneck class:
   - algorithm/complexity,
   - repeated transforms,
   - over-fetching/over-rendering,
   - blocking sync work,
   - wait/synchronization waste.
4. Propose 1-3 minimal, reversible changes ordered by expected ROI.
5. Implement one change at a time.
6. Re-measure and compare baseline vs after.
7. Keep/rollback based on measurable outcome.

## Optimization heuristics

- Measure before changing code.
- Prefer algorithmic simplification over micro-optimizations.
- Prefer reducing work over caching work.
- Keep behavior, contracts, and observability intact.
- Reject optimizations that add complexity without clear wins.

## Stack-specific guidance

### Hono

- Minimize per-request CPU work in routes; shift heavy logic to services.
- Validate once with Zod at boundary and keep typed payloads downstream.
- Avoid N+1 calls and unbounded result sets; paginate and select only needed fields.
- Keep response payloads compact and stable.

### React + Vite

- Profile rerenders on hot pages; reduce rerender surface first.
- Memoize expensive derived data when it materially lowers work.
- Virtualize large lists and defer heavy UI blocks.
- Use route-level lazy loading where startup cost is high.
- Watch bundle growth and remove dead/duplicated dependencies.

### Playwright

- Replace static sleeps with explicit condition waits.
- Use resilient selectors and scoped locators to reduce retry churn.
- Reuse setup work (context/auth/session) when safe.
- Capture diagnostics on failures, not on every fast path step.

## Guardrails

- No breaking endpoint changes unless intentionally versioned.
- No validation bypass at API boundaries.
- No secret leakage in logs or test artifacts.
- Preserve run-state/status observability.

## Verification baseline

- `bun run type-check`
- `bun run build`
- `bun run test`
- If automation changed: `bun run --cwd automation typecheck`

## Response format expectations

- Start with a short implementation summary and intent.
- List changed files and purpose per file.
- Note key before/after design decisions in concise terms.
- Include verification commands executed and outcomes (or exact manual checks if not run).
- Call out unresolved risks, deferred follow-up actions, and rollback notes when relevant.

## Performance checklist template

```md
Performance Checklist
- Target flow/path:
- Baseline metric(s):
- Bottleneck hypothesis:
- Planned change type: [algorithm | deduplication | caching | batching | rendering]
- Affected layers: [server | client | automation | shared]
- Contract impact: [none | additive | breaking]
- Validation boundary impact:
- Observability impact:
- Post-change metric(s):
- Regression checks run:
- Rollback trigger:
```
