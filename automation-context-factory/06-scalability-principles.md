# Scalability Principles

## Contract scalability

- Favor additive schema evolution; avoid breaking field renames/removals.
- Version behavior with optional fields and defaults before hard switches.
- Keep one canonical contract per concern in `shared`.

## Runtime scalability

- Design automation runs to be resumable and diagnosable.
- Keep runtime payloads structured and compact.
- Maintain bounded in-memory buffers on consumers.

## Codebase scalability

- Separate concerns by layer and feature folder.
- Prefer pure mapping/parse functions for testability.
- Avoid hidden coupling between client display logic and automation internals.

## Operational scalability

- Ensure critical paths are observable (run start, row transitions, failures).
- Keep idempotent-safe behavior where retries may occur.
- Optimize for safe fallback paths, not silent failure paths.

## Performance guardrails

- Avoid O(n^2) transforms in hot paths.
- Batch where practical, while preserving ordering guarantees.
- Cap memory usage and keep UI responsive under high volume.
