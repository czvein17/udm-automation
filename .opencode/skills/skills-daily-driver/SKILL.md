---
name: skills-daily-driver
description: Meta-skill that routes work to perf-auditor, refactor-guardian, or coder-buddy with consistent outputs.
compatibility: opencode
---

# SKILL.md

Daily driver orchestration skill for this repository.

## Goal

Choose the minimum safe skill path for a task, execute in small reversible slices, and return consistent implementation reporting.

## Routing rules

1. Use `perf-auditor` first when the task indicates performance risk:
   - slow endpoints/pages, latency, rerenders, memory growth,
   - bundle size regressions,
   - flaky waits/timeouts in automation.
2. Use `refactor-guardian` when the task indicates maintainability issues:
   - duplicated logic,
   - high branching complexity,
   - readability/DRY/KISS cleanup.
3. Use `coder-buddy` for cross-layer implementation hardening:
   - shared schema/API compatibility,
   - server/client/automation boundary safety,
   - final verification and risk report.

## Default execution policy

- Default mode: implement + verify.
- Switch to plan-only mode only when explicitly requested.
- Keep changes minimal, local, and reversible.
- Preserve existing API compatibility unless intentionally versioned.
- Keep Zod validation at boundaries and never hardcode secrets.

## Recommended pipeline

1. Diagnose (perf-auditor) when performance is involved.
2. Refactor (refactor-guardian) one slice at a time.
3. Harden + verify (coder-buddy) before finalizing.

## Input template for users

Use this structure when starting a task:

```md
Task:
Target files/features:
Goal:
Constraints:
Mode: [implement+verify | plan-only]
```

## Response format expectations

- Start with a short implementation summary and intent.
- List changed files and purpose per file.
- Note key before/after design decisions in concise terms.
- Include verification commands executed and outcomes (or exact manual checks if not run).
- Call out unresolved risks, deferred follow-up actions, and rollback notes when relevant.

## Teammate docs

- See `./.opencode/skills/quick-onboarding/ONBOARDING.md` for human onboarding.
- Canonical developer onboarding doc: `documentation/onboarding.md`.
