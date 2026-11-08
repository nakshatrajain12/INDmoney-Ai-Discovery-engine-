# Phase 3: Module 1 — Return Coach Core (Deterministic Templates & Citations)

**Date:** 2026-11-09  
**Reviewer:** Owner Sign-off Pending  
**Status:** Engineering Complete. All Phase Gate 3 Acceptance Criteria Met.

---

## 1. Tasks Summary

| Task | Status | Implementation Details |
|---|---|---|
| **Content Library & Templates** | Complete | Authored structured 3-block narratives across all situations (`FLAT`, `SMALL_NEGATIVE`, `NEGATIVE`, `SMALL_POSITIVE`, `POSITIVE`, `INSUFFICIENT_DATA`) and stages in `src/content/templates/catalog.ts`. |
| **Vetted Financial Terms** | Complete | Definitional glossary for `XIRR`, `ABSOLUTE_RETURN`, `NAV`, `VOLATILITY`, `UNREALISED_RETURN` in `src/content/terms.ts` with mandatory short-period XIRR warning for tenures < 12 months. |
| **Verified Citations Library** | Complete | Authored `src/domain/sources/library.ts` with authentic regulatory citations from AMFI, SEBI, and CRISIL with live URLs and verified dates. Deterministic selection in `src/domain/sources/select.ts`. |
| **Placeholder Replacement Engine** | Complete | Strict placeholder interpolation in `src/domain/explain/templates.ts`. Guaranteed Indian grouping format, 0 unparsed tokens, fails on unknown token. |
| **Deterministic Intent Guard** | Complete | Pre-compiled regex engine in `src/domain/explain/intent-guard.ts` detecting advice, buy/sell imperatives, recommendations, predictions, and timing inquiries. |
| **Static Non-Advice Refusal** | Complete | Static refusal response in `src/content/refusal.ts` stating: *"I can't tell you whether to continue, stop, buy or sell your mutual fund investments..."* with permanent disclaimer *"Explains your SIP figures. Not investment advice."* |
| **Pressure-Language Linter** | Complete | Verified all authored templates, terms, and refusal texts through `src/lib/banned-phrases.ts` with zero violations. |
| **Return Coach Orchestrator** | Complete | Pure TypeScript pipeline in `src/domain/explain/orchestrator.ts` connecting data provider -> intent guard -> return engine -> template selector -> placeholder formatting -> source matching -> confidence scoring -> Zod validation. |
| **Route Handlers** | Complete | `POST /api/v1/sips/[id]/coach`, `GET /api/v1/terms/[key]`, `GET /api/v1/sources`. |
| **CLI Verification Harness** | Complete | `scripts/coach.ts` evaluating any single persona or batch evaluating all 30 personas. |
| **No-Op Rephraser** | Complete | Interface and `NoopRephraser` in `src/domain/explain/rephraser.ts`. Zero LLM dependencies in Phase 3. |

---

## 2. Phase Gate 3 Checklist Verification

- [x] **Return Coach generates valid 3-block responses for all 30 mock personas (32 SIPs).**  
  Verified by `tests/unit/explain/orchestrator.test.ts` and `npx tsx scripts/coach.ts --all`. Every response strictly matches `CoachResponse` Zod schema.
- [x] **100% advice-refusal rate on test prompts.**  
  Verified by `tests/unit/explain/intent-guard.test.ts` across 44 adversarial prompts covering direct, indirect, imperative, timing, recommendation, and prediction queries.
- [x] **Zero unformatted or unparsed `{{placeholder}}` tokens in output.**  
  Verified by regex assertion across all rendered narrative outputs.
- [x] **Zero hallucinated figures.**  
  Every numeral in the narrative output strictly matches the computed figures from the Phase 2 deterministic engine.
- [x] **Zero banned phrases or pressure language.**  
  All templates and refusal copy pass `findBannedPhrases` with 0 matches.
- [x] **Short-period XIRR disclaimer present for tenures < 12 months.**  
  Verified by source selection and term definitions.
- [x] **Architectural boundary intact.**  
  No LLM library imported in deterministic code; `tests/unit/architecture-boundary.test.ts` passes.

---

## 3. Test Evidence

- `npm run typecheck`: **0 errors**.
- `npm run lint`: **0 errors, 0 warnings**.
- `npm test`: **375 unit tests passing across 24 test files** (100% green).
- `npm run build`: **Next.js production build succeeded**; all dynamic route handlers registered.

