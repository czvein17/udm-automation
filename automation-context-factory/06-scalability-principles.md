# Scalability Principles

## Contract scalability

- Favor additive schema evolution; avoid breaking field renames/removals.
- Version behavior with optional fields and defaults before hard switches.
- Keep one canonical contract per concern in `shared`.

## Runtime scalability

- Design automation runs to be resumable and diagnosable.
- Keep logs structured and compact; avoid giant payloads in `meta/details`.
- Maintain bounded in-memory buffers on stream consumers.

## Codebase scalability

- Separate concerns by layer and feature folder.
- Prefer pure mapping/parse functions for testability.
- Avoid hidden coupling between client display logic and automation internals.

## Operational scalability

- Ensure critical paths are observable (run start, row transitions, failures).
- Keep idempotent-safe behavior where retries may occur.
- Optimize for safe fallback paths, not silent failure paths.

## Performance guardrails

- Avoid O(n^2) transforms in hot stream paths.
- Batch where practical, but preserve ordering guarantees for row events.
- Cap memory usage for live logs and keep UI responsive under high volume.
