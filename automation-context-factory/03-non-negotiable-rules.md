# Non-Negotiable Rules

1) Shared contracts first.

- If a contract changes, update `shared` first, then server/client/automation.
- Do not introduce parallel ad-hoc types for existing shared contracts.

2) Preserve log transport compatibility.

- Keep endpoint paths and envelope compatibility for log ingestion/history/stream.
- Preserve tolerant parsing for mixed payload quality.

3) Keep reporter lifecycle coherent.

- Canonical flow: `run_start -> row_start -> row_step* -> row_end`.
- Keep grouping stable with `taskId` (or existing fallback key).

4) Respect response conventions.

- Use `ApiResponse<T>` where established.
- Keep status + error semantics explicit and predictable.

5) Secrets hygiene is strict.

- Never hardcode secrets.
- Never commit `.env`, tokens, private keys, or sensitive auth state.

6) No validation bypass.

- Validate request boundaries via Zod.
- Fail malformed input early with clear errors.

7) Safety-first automation.

- Avoid destructive actions by default.
- Emit reporter steps before/after risky actions.
