---
name: quick-onboarding
description: Onboarding coach skill for teammates adopting OpenCode skills in this monorepo.
compatibility: opencode
---

# SKILL.md

Quick onboarding skill for developers and AI agents in `udm-automation`.

## Goal

Get a teammate productive quickly with repository context, command baseline, and the right skill usage pattern.

## What this skill should produce

1. A concise onboarding path tailored to the requested role/scope.
2. The right skill-routing recommendation (`skills-daily-driver`, `perf-auditor`, `refactor-guardian`, `coder-buddy`).
3. A first-task checklist with verification and rollback notes.

## Onboarding flow

1. Confirm role and target layer (`server`, `client`, `shared`, `automation`).
2. Point to canonical policy docs:
   - `AGENTS.md`
   - `automation-context-factory/AGENTS.md`
   - numbered context-factory files in order.
3. Share essential commands and verification baseline.
4. Provide copy/paste prompt templates for the selected skill path.
5. End with first small safe task recommendation.

## Required references

- `./.opencode/skills/quick-onboarding/ONBOARDING.md`
- `./.opencode/skills/skills-daily-driver/SKILL.md`
- `documentation/onboarding.md`

## Response format expectations

- Start with a short implementation summary and intent.
- List changed files and purpose per file.
- Note key before/after design decisions in concise terms.
- Include verification commands executed and outcomes (or exact manual checks if not run).
- Call out unresolved risks, deferred follow-up actions, and rollback notes when relevant.
