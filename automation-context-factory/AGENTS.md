# AGENTS.md

Canonical AI-agent contract for `udm-automation`.

Load these files in order before implementing work:

1. `automation-context-factory/01-product-intent.md`
2. `automation-context-factory/02-context-factory-template.md`
3. `automation-context-factory/03-non-negotiable-rules.md`
4. `automation-context-factory/04-architecture-and-boundaries.md`
5. `automation-context-factory/05-engineering-standards.md`
6. `automation-context-factory/06-scalability-principles.md`
7. `automation-context-factory/07-change-playbooks.md`
8. `automation-context-factory/08-verification-and-dod.md`

## Usage protocol

- Treat this folder as the single source of truth for agent behavior.
- If two docs conflict, precedence is by numeric order (lower number wins).
- Keep updates additive and explicit; avoid hidden rule changes.
- When adding new policy, either extend an existing numbered file or add a new numbered file and reference it here.
