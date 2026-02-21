# Feature Reporter Architecture

## Purpose

The reporter pipeline turns automation execution into user-readable row reports in the Logs panel.

## Event lifecycle

1. Automation creates a `Reporter` via `createReporter(...)`.
2. Reporter emits typed business events (`run_start`, `row_start`, `row_step`, `row_end`) through one transport boundary.
3. Logger transport sends each event as existing `LogEvent` shape (`message=<event.type>`, `meta=<event>`, `ctx=<run+row context>`).
4. Server parses and validates incoming logs, stores in `automation_logs`, and broadcasts to `ws/logs/:runId`.
5. Client `useLogsStream` loads REST history + streams WS updates with reconnect/backoff.
6. `buildLogsDisplayModel(...)` maps raw events into header + row cards + actions + issues.

## Canonical contracts

- Shared log envelope: `shared/src/schema/logs.schema.ts`
- Shared reporter events: `shared/src/schema/reporter.schema.ts`
- Reporter implementation: `automation/src/shared/reporter.ts`

Reporter events are discriminated by `type`:

- `run_start`
- `row_start`
- `row_step`
- `row_end`

## Module boundaries

- **Event creation**
  - `automation/src/shared/reporter.ts`
  - Pure event factories: `createRunStartEvent`, `createRowStartEvent`, `createRowStepEvent`, `createRowEndEvent`
- **Transport**
  - `automation/src/shared/logger.ts`
  - Reporter receives a transport (`info/warn/error/debug`) and defaults to `makeLogger(...)`
- **Server parse/normalize**
  - `server/src/feature/logs/logs.parser.ts`
  - `normalizeReporterMeta(...)` validates reporter meta against shared schema when possible
- **Stream handling**
  - `client/src/features/UDMAutomations/hooks/useLogsStream.ts`
  - Pure helpers in `useLogsStream.utils.ts` (cap, backoff, ws URL, payload parsing)
- **UI mapping**
  - `client/src/features/UDMAutomations/components/LogsTerminal.mapper.ts`
  - `LogsTerminal.tsx` is presentational only

## Sequence (text diagram)

`createReporter.row(...).step(...)`
→ `transport.info("row_step", meta=<row_step>, ctx=<row ctx>)`
→ `POST /api/v1/reporter/runs/:runId/events`
→ `server parse + insert`
→ `ws reporter:line`
→ `useLogsStream pushOne/pushBatch`
→ `buildLogsDisplayModel`
→ `Row card ACTIONS`

## Adding a new event type safely

1. Add schema/type in `shared/src/schema/reporter.schema.ts`.
2. Export from `shared/src/schema/index.ts`.
3. Add factory function in `automation/src/shared/reporter.ts`.
4. Emit via reporter (`row.step`, `row.warn`, `row.ok`, `row.fail` or new helper).
5. Add parser normalization test in `server/src/feature/logs/logs.parser.test.ts`.
6. Add UI mapping test in `LogsTerminal.mapper.test.ts`.

## Testing strategy

- Reporter unit tests: event creation + emission lifecycle
- Parser tests: malformed payloads + reporter meta normalization
- Stream utility tests: backoff, message parsing, high-volume capping
- Mapper tests: reporter events → header/group/actions/issues
