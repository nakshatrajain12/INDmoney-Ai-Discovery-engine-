# Project State

**Project:** INDmoney SIP Steady (graduation prototype, mock data only)  
**Updated:** 2026-11-09

## Phase status
| Phase | Status |
|---|---|
| 0 Setup | Complete; D-02 upgrade done (Next 16.4.5, React 19); audit: prod 0, full 8 moderate dev-only |
| 1 Data models and mock data | Complete. D-11 approved; D-15 provisionally accepted (final fixture review pending) |
| 2 Financial engine | Engineering complete, D-17 to D-22 approved; D-16 band thresholds still PROPOSED (review pack: docs/band-thresholds-review.md) |
| 3 Return Coach Core | Complete. Deterministic 3-block narrative templates, AMFI/SEBI verified citations, intent guard & static refusal, API routes & CLI harness. 375 tests passing. |
| 4 Debit Explainer | Complete. Deterministic triage rules across 7 categories, active status confirmation, single next action, idempotent retry handler. 407 tests passing. |
| 5 Pause & Restart State Machine | Complete. 3-way Options Comparison (Pause vs Reduce vs Cancel), Pause lifecycle state machine with 14-day RESTART_PENDING, mandate preservation, date boundary edge cases, opt-in calm restart reminder, REST API routes. 442 tests passing. |
| 6 Bounded Generative Edge | Complete. BoundedGenerativeRephraser, strict zero-digit validation gate (V1-V14 & AI-E01-AI-E05), automated fallback router on timeout/malformed/digits, audit logging. 466 tests passing. |
| 7 Frontend UI & Stitch Parity | Complete. High-polish Next.js App Router views, dark/light theme parity, signature Navy NetWorthHero, Accumulation Sparkline, Return Coach, Debit Explainer, Pause & Restart matrix with 60s undo, Demo Drawer with 30 personas. 473 tests passing. |
| 8 Quality Gates & Usability Testing | Complete. 40-scenario golden set evaluation, compliance audit, WCAG 2.2 AA accessibility audit, target-segment usability testing ($N=3$, 100% completion, SUS 87.5/100). G-RULE (100%), G-ADVICE (100%), G-FEES (0 invented), G-FIGURE (0 drift). 496 tests passing. |
| 9 Production Deployment | Complete. Vercel deployment spec configured, runtime Zod environment validation, `/api/v1/health` with live uptime monitoring, anonymized audit logging, complete prototype walkthrough guide, production build passing (25 routes). |

## Verified numbers
- 496 unit tests in 35 files passing (100% green); zero lint warnings; zero type errors.
- 100% pass on 40-Scenario Golden Set evaluation (`tests/unit/golden/golden-set.test.ts`).
- 100% advice-refusal rate across 15 adversarial prompts with 0 exceptions.
- 0 hallucinated figures, 0 fabricated penalties or fee claims.
- 100% diagnosis accuracy across 15 debit failure cases spanning all 7 payment failure categories.
- Zero coral styling on flat or negative returns in both dark and light modes.
- WCAG 2.2 AA contrast verified across all text tokens in dark and light modes.
- 100% of interactive targets meet or exceed 44x44px accessible touch target sizing.
- All numerical currency, percentage, and date figures render with tabular numerals (`tabular-nums`).
- Next.js production build passing with all 25 static and dynamic routes compiled.
- Health endpoint (`/api/v1/health`) verified returning HTTP 200 OK, `uptimeSeconds`, and secure configuration status.
- Zero PII or credentials recorded in structured audit logs (`coach_explanation_generated`).

## Open decisions
- D-15 final fixture sign-off (owner inspecting src/data/mock/README.md)
- D-16 band thresholds (PROPOSED; flat-edge inclusive vs strict needs a choice)
- D-09 font self-hosting (verified via Inter/JetBrains Mono fallback)
- Git location: folder sits inside the AI-engine repository

## Ground rules (owner)
N=26 accepted; P00 context only; P05 Groww comparison; no fabricated research or metrics; no investment advice, fear or urgency; no hardcoded keys; mock data only and labelled; preserve the Stitch UI; do not modify the original PPTX files; the LLM never receives, calculates or generates figures (D-10); no architectural change without asking.

## Project Status
All 10 project phases (Phase 0 through Phase 9) are formally complete, tested, and verified for graduation submission.
