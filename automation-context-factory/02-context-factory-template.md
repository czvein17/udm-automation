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
- Confirm endpoint compatibility for active API routes.
- Confirm validation boundaries still use Zod at input edges.
