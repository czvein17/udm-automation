---
name: refactor-guardian
description: Refactor coach for applying DRY, KISS, and maintainable engineering standards without breaking behavior.
compatibility: opencode
---

# SKILL.md

Refactor-first skill profile for AI agents working in this repository.

## Goal

Improve code quality through safe, incremental refactors that reduce duplication, simplify logic, and preserve behavior.

## Core principles

- DRY: remove meaningful duplication, not superficial text similarity.
- KISS: choose the simplest solution that keeps intent clear.
- YAGNI-aware: do not add abstractions without current need.
- Readability-first: optimize for future maintainers.
- Compatibility-first: preserve existing contracts and runtime behavior.

## Refactor operating loop

1. Build context brief from `automation-context-factory/02-context-factory-template.md`.
2. Map affected layers (`automation`, `server`, `client`, `shared`) and contracts.
3. Find high-value refactor targets:
   - duplicate business rules,
   - repeated data mapping/parsing,
   - long branching functions,
   - hard-to-follow control flow.
4. Choose minimal change strategy:
   - extract pure helper,
   - consolidate shared mapper,
   - split function by responsibility,
   - remove dead/unused code.
5. Apply one coherent refactor slice at a time.
6. Verify behavior and type safety.
7. Report changes, tradeoffs, and residual risks.

## Decision heuristics

When DRY and KISS appear to conflict, use these tie-breakers:

1. Prefer KISS if deduplication creates indirection that harms local clarity.
2. Prefer DRY if duplicated logic controls correctness or contract behavior.
3. Avoid shared utilities for one-off call sites.
4. Extract only stable concepts with clear names.

## Refactor patterns

### Safe extraction

- Extract side-effect-free logic into pure functions.
- Keep IO and orchestration at feature boundaries.
- Name helpers after domain intent, not implementation detail.

### Duplication cleanup

- Consolidate repeated normalization/parsing into one utility.
- Centralize shared contract transforms near `shared` schemas.
- Remove copy-paste guards by introducing focused predicates.

### Simplification

- Replace deep nesting with guard clauses when it improves readability.
- Break large functions into small composable units.
- Prefer explicit data structures over implicit tuple/array conventions.

### Performance optimization practices

- Optimize after identifying hot paths; avoid speculative tuning.
- Prefer algorithmic wins first (complexity reduction) before micro-optimizations.
- Eliminate duplicate transforms by computing once and reusing results.
- Keep mappers/parsers pure and linear-time for large collections.
- Avoid O(n^2) loops in request handlers and client render paths.
- Batch independent IO while preserving ordering and failure visibility.
- Cap in-memory buffers; stream or paginate large payloads when possible.
- Cache only stable, high-cost results and define clear invalidation rules.
- In React, minimize unnecessary re-renders by stabilizing props and derived state.
- In server handlers, avoid blocking sync work; prefer async boundaries and small units.
- In Playwright automation, wait on explicit states/selectors instead of fixed sleeps.
- Add lightweight before/after evidence (timing, counts, memory) for meaningful perf changes.

### Stack-specific optimization techniques

#### Hono (server)

- Keep route handlers thin; move parsing and heavy transforms to services/utilities.
- Validate once at boundary with Zod, then pass typed data through the pipeline.
- Avoid repeated JSON parsing/normalization across middleware and handlers.
- Prefer pagination and selective fields for large list endpoints.
- Use indexed query patterns and avoid N+1 repository calls.
- Keep response envelopes stable and compact (`ApiResponse<T>` where established).

#### React + Vite (client)

- Keep expensive derivations in memoized selectors/utilities, not inline render bodies.
- Split large pages into focused components to reduce rerender blast radius.
- Stabilize callback/object props passed to memoized children when beneficial.
- Virtualize large lists and avoid rendering offscreen rows.
- Lazy-load route-level features and heavy modules where UX allows.
- Keep bundle hygiene: remove dead imports, avoid large utility over-inclusion.

#### Playwright automation

- Prefer resilient locator strategies (`getByRole`, semantic selectors) over brittle CSS chains.
- Replace fixed delays with `expect`/state-based waits and explicit timeout ownership.
- Reuse browser context/page setup when safe to reduce startup overhead.
- Keep retries targeted to idempotent steps only; do not hide deterministic failures.
- Capture minimal but actionable diagnostics (step name, selector, task/run context).
- Avoid unnecessary screenshots/traces in hot paths; keep detailed artifacts for failures.

### Boundary discipline

- Do not bypass server APIs from `client`/`automation` for DB writes.
- Keep route handlers thin; move logic to services/utilities.
- Keep presentational React components free of data-fetch logic.

## Non-negotiable safety checks

- Preserve active API endpoint paths and `ApiResponse<T>` conventions.
- Update `shared` contracts first if cross-layer payloads change.
- Keep Zod validation at input boundaries.
- Never hardcode secrets or log sensitive tokens.
- Keep runtime status transitions explicit and observable.

## Verification baseline

From repo root (unless task scope is narrower):

- `bun run build`
- `bun run type-check`
- `bun run test`

If automation workspace changed:

- `bun run --cwd automation typecheck`

For performance-sensitive refactors, also verify:

- Compare baseline vs refactor timing on the impacted flow.
- Confirm no increase in memory growth under representative data volume.
- Confirm UI remains responsive under high-volume lists/updates.
- Confirm run-state/status observability is unchanged.

## Definition of done for refactors

- Behavior unchanged (or intentional behavior change documented).
- Duplication reduced in targeted area.
- Complexity lowered (fewer branches, smaller functions, clearer names).
- Performance is same or better on affected path (when perf-sensitive).
- Contracts and validation boundaries remain correct.
- Relevant verification commands completed.

## Response format expectations

- Start with a short implementation summary and intent.
- List changed files and purpose per file.
- Note key before/after design decisions in concise terms.
- Include verification commands executed and outcomes (or exact manual checks if not run).
- Call out unresolved risks, deferred follow-up actions, and rollback notes when relevant.

## Performance checklist template

Use this block in working notes for perf-sensitive refactors:

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
