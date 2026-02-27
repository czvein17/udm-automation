# Non-Negotiable Rules

1) Shared contracts first.

- If a contract changes, update `shared` first, then server/client/automation.
- Do not introduce parallel ad-hoc types for existing shared contracts.

2) Preserve runtime compatibility.

- Keep active endpoint paths and envelopes compatible unless intentionally versioned.
- Prefer additive changes over breaking rewrites.

3) Respect response conventions.

- Use `ApiResponse<T>` where established.
- Keep status + error semantics explicit and predictable.

4) Secrets hygiene is strict.

- Never hardcode secrets.
- Never commit `.env`, tokens, private keys, or sensitive auth state.

5) No validation bypass.

- Validate request boundaries via Zod.
- Fail malformed input early with clear errors.

6) Safety-first automation.

- Avoid destructive actions by default.
- Emit clear status before/after risky actions.
