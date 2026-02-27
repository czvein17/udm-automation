# Engineering Standards

## General

- Keep changes minimal, local, and reversible.
- Prefer explicit names and small modules.
- Avoid broad refactors unless the task requires them.
- Keep TypeScript strictness; avoid `any` unless justified.

## Automation (Node + Playwright)

- Keep entrypoint at `automation/src/cli.ts` and `jobRegistry`-driven jobs.
- Centralize selectors in `automation/src/selectors`.
- Do not swallow errors; log context then rethrow when needed.

## Server (Hono)

- Preserve existing REST contracts.
- Keep parsing/normalization logic out of route files.

## Client (React)

- Keep data-fetch/state logic in hooks and mapping in pure utils.
- Keep presentational components focused on rendering.
