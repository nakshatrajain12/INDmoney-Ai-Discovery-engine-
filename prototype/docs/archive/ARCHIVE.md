# Archive

Historical documents kept for traceability. **They are not authoritative.** The current documents are the ones in `prototype/docs/` (one level up).

## `mvp-original/`
The first-generation MVP specification set, from the former top-level `MVP/` folder (MVP and the prototype are the same product and were consolidated into `prototype/`):

- `architecture.md` (current: `../architecture.md`)
- `edge-case.md` (current: `../edge-cases.md`)
- `implementation-plan.md` (current: `../implementation-plan.md`)

The other MVP documents (`design-system.md`, `problem-statement.md`, `research-context.md`) were byte-identical to the current ones and were not archived.

## `superseded-stubs-and-drafts/`
Earlier copies that lived in `prototype/docs/` and were replaced by the fuller versions previously kept in the repository-root `docs/` folder. Most are placeholder stubs ("stub, to be written"); `detailed-rice` and `user-flow` are smaller earlier drafts. Current versions: `../<same filename>`.


## Exception: `evaluation-framework`
`../evaluation-framework.md` is the original Phase 0-1 version and stays in place because `tests/unit/data/fixtures.test.ts` reads its section 2.1. The fuller rewrite that was in the repository-root `docs/` is saved as `../evaluation-framework-v2.md`. The owner decides which becomes authoritative (if v2, the test must be updated in a separate product change).
