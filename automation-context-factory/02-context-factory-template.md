# Context Factory Template

Before coding, every agent must create this brief in working notes:

```md
Task:
Affected layers: [automation|server|client|shared]
Primary contracts touched:
Runtime impact:
Risk level: [low|medium|high]
Verification plan:
Rollback plan:
```

## Minimum checks

- Confirm whether `shared/src/schema` contracts change.
- Confirm whether logs/reporter lifecycle changes (`run_start -> row_start -> row_step* -> row_end`).
- Confirm endpoint compatibility for:
  - `POST /api/v1/reporter/runs/:runId/events`
  - `GET /api/v1/reporter/runs/:runId/events`
  - `/ws/reporter/:runId`
- Confirm validation boundaries still use Zod at input edges.
