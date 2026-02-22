# Performance Optimization Phases

This document tracks safe, additive performance improvements across client, server, and automation.

## Phase 0 - Baseline Hardening

Status: Completed

Scope:
- Bounded live log memory and buffered websocket event commits.
- Optimized hot-path log mapping loops.
- Added automation browser/page/context cleanup in `finally` blocks.
- Added non-blocking logger transport with bounded backpressure.
- Added hot indexes for log reads.
- Removed N+1 task-log read path and switched task-log writes to append entries.

Verification:
- `bun run type-check`
- `bun run build`
- `bun run test`
- `npm run typecheck` in `automation/`

Rollback:
- Revert Phase 0 commit only.

## Phase 1 - Incremental Logs Display Model

Status: Completed

Scope:
- Added incremental logs display accumulator and append processor.
- `LogsTerminal` now processes appended events incrementally.
- Falls back to full rebuild automatically when data shape changes (run switch, prepend, or reset).

Safety notes:
- No endpoint or payload contract changes.
- Same output model shape for grouped rows and header rendering.

Verification:
- `bun run build:client`
- Manual run with active websocket stream and history pagination.

Rollback:
- Revert Phase 1 commit only.

## Phase 2 - Run Summary Pre-Aggregation

Status: Completed

Scope:
- Added `reporter_run_summaries` table and indexes.
- Maintains per-run aggregates on log insert.
- `GET /api/v1/reporter/runs` reads summaries table first, with raw-log fallback for safety.

Safety notes:
- Additive schema only.
- Existing reporter endpoints unchanged.
- Fallback path preserves historical compatibility if summaries are missing.

Verification:
- `bun run build:server`
- `bun run type-check`
- Manual check: insert events -> run history updates.

Rollback:
- Revert Phase 2 commit only.
- Optional: keep additive table; it is unused after revert.

## Phase 3 - Benchmarks and Metrics Capture

Status: Completed

Scope:
- Added lightweight benchmark runner:
  - `scripts/perf/reporter-bench.ts`
- Added scripts:
  - `bun run perf:reporter`
  - `bun run perf:capture`

Capture commands:
- Baseline:
  - `bun run perf:capture --label=baseline`
- After optimization:
  - `bun run perf:capture --label=after-phaseX`

Results storage:
- `artifacts/perf/reporter-bench.ndjson`
- One JSON object per run (append-only).

## Benchmark Snapshot (Current)

Source: `artifacts/perf/reporter-bench.ndjson`

| Label | Samples | History avg (ms) | History p95 (ms) | Ingest avg (ms) | Ingest p95 (ms) |
|---|---:|---:|---:|---:|---:|
| phase-0-after | 1 | 1.209 | 12.815 | 2.208 | 3.169 |
| phase-3-after | 5 | 1.089 | 12.598 | 1.870 | 2.820 |

Delta (`phase-3-after` vs `phase-0-after`):
- History avg: `-9.965%`
- History p95: `-1.697%`
- Ingest avg: `-15.324%`
- Ingest p95: `-11.001%`

Notes:
- `phase-0-after` currently has one sample; collect more baseline samples for stronger statistical confidence.
- Run `bun run perf:capture --label=<label>` multiple times and recompute via `bun run perf:summary`.

## Metrics Template

Use this template in PR descriptions:

- Environment: local dev / staging
- Dataset: number of runs + events
- History endpoint avg/p95 (ms): before -> after
- Ingest avg/p95 (ms): before -> after
- Client stream FPS/responsiveness notes: before -> after
- Memory notes (client/server/automation): before -> after

## Done Definition For Performance Work

A phase is complete when all are true:
- Additive/safe rollout strategy is preserved.
- Endpoint and reporter lifecycle contracts stay compatible.
- Validation commands pass.
- Benchmark snapshot is captured and documented.
