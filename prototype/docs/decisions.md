# Decision Log

Format: ID · date · decision · why · status. Items marked **Owner to confirm** are assumptions I made so work could continue; please confirm or correct them.

## Resolved by the owner (2026-11-08)

| ID | Decision | Outcome |
|---|---|---|
| **D-02** | Next.js security advisories: **Option A approved** (upgrade now). | **Done.** Next 16.4.5, React 19, Zod 4.6.7, ESLint 9, Vitest 5. `npm audit --omit=dev`: 0 vulnerabilities. Full audit: 8 moderate, 0 high, 0 critical (all in the ESLint toolchain, dev-only; npm's only "fix" is a downgrade, so it was not applied). Documented in `architecture.md` §17. |
| **D-04** | Evaluation framework: **approved**. | **Done.** `docs/evaluation-framework.md`: 40 scenarios in 12 categories, a 14-case validator suite, gates and labelling protocol. Nothing has been run. |
| **D-10** | LLM role: **approved as per the original architecture**, strictly. The model never receives, calculates, modifies or generates financial figures; it only rephrases approved template prose containing placeholders (`summary`, `explanation`, `tenure_context`, `metric_explanation`, `limitations`); a changed, removed or introduced figure means the response is rejected. | **Recorded** in `architecture.md` §17.5 and `evaluation-framework.md` (gate G-FIGURE and validator suite). To be implemented in Phases 3 and 7. |
| **D-11** | `RESTART_PENDING`: **approved**. Paused AND a valid, present restart date AND restart 14 calendar days or fewer away. Open-ended pauses never qualify; a restart reminder alone never qualifies. Keep identical across data model, logic, frontend labels and tests. | **Done.** `src/data/status.ts` (also rejects a restart date before the pause start); boundary tests at 13, 14 and 15 days, past dates, open-ended pauses, non-paused states, invalid dates and reminder-only; `engine.test.ts` checks the engine never touches status. The clickable prototype (`clickable-prototype/clickable/app.js`) applies the same `<= 14` day rule to the resume date; it has no separate RESTART_PENDING label (it shows "Paused · resumes <date>"), which the Phase 6 UI must map. |
| **D-15** | Mock fixtures: **PROVISIONALLY ACCEPTED, not fully reviewed or signed off.** NAV histories are illustrative and never real market data; `MOCK_` reason codes are simulated; all 30 fixtures labelled demo data; figures internally consistent; XIRR-failure fixtures must genuinely fail. The owner will inspect `src/data/mock/README.md` before final sign-off. Fixtures preserved unchanged; no silent edits or removals. | **Open.** Fixtures unchanged in Phase 2 (no fixture file was edited). Assumptions and limitations documented in `src/data/mock/README.md`. `xirr-fails` verified to fail because its root lies above the +10,000% bound (see `xirr.test.ts`, `make_xirr_vectors.py`). |

## Decided during implementation

| ID | Date | Decision | Why |
|---|---|---|---|
| D-01 | 2026-11-08 | Stack: Next.js App Router + TypeScript (strict) + Tailwind 3.4 + Zod + Vitest; route handlers as the API in one deployment. Now on Next 16 / React 19 (see D-02). | Matches `architecture.md` |
| D-03 | 2026-11-08 | **No database yet.** Data comes from typed fixtures through a `SipDataProvider` with an in-memory read-only mock provider. A persistent store is a Phase 5 / Phase 8 question (pause and reminder state must survive serverless invocations). The Phase 1 "seed and migration" criteria are therefore not applicable. | `architecture.md` leaves the ORM open; simplest reliable approach |
| D-05 | 2026-11-08 | API envelope: success `{ requestId, data }`; error `{ requestId, error: { code, message, retryable, fallbackShown } }`; every response has `x-request-id` and `cache-control: no-store`. | `architecture.md` §11 |
| D-06 | 2026-11-08 | Structured JSON logging with redaction of sensitive keys and masking of emails, PAN and long digit runs. | PRD PV-3 |
| D-07 | 2026-11-08 | Config: Zod-validated, server-only, empty strings are unset; `LLM_ENABLED=true` requires provider, model and key; health shows booleans only. | PRD PV-2, FS-5 |
| D-08 | 2026-11-08 | Pressure and advice linter in `src/lib/banned-phrases.ts`; only the fixed refusal sentences may name "buy or sell". CI will run it over `src/content` from Phase 3. | PRD FS-8 |
| D-12 | 2026-11-08 | **Data representation:** money in integer paise; NAV and units as integers scaled by 10,000; dates as real ISO calendar dates; SIP status **derived, never stored**; "declared" totals stored only as source claims that the validator checks and the Phase 2 engine recomputes. | Avoids floating-point money; one source of truth for status |
| D-13 | 2026-11-08 | **30 personas** (not 10): the original ten, the nine extra fixtures the evaluation framework needs, one persona per payment-failure category (7), plus `debit-no-reason`, `debit-recovered`, `pause-scheduled` and `cancelled-with-failure`. Each declares its expected status, return band and intentional anomalies; the validator requires detected anomalies to equal declared ones. | Master prompt Phase 1 and `evaluation-framework.md` §2.1 |
| D-14 | 2026-11-08 | **Provider XIRR** is supplied for three personas (`early-flat`, `positive`, `long-tenure`) as constants computed with an independent root finder (Python `brentq`, then re-checked in a TypeScript reference solver). Others have none, so the engine recomputes. | Gives Phase 2 a real "as shown in your account" value to reconcile against |

## Owner to confirm

| ID | Blocks | Assumption |
|---|---|---|
| D-09 | Phase 8 | Inter is referenced by the CSS stack with no build-time download; decide whether to self-host before deployment. |

## Phase 2 decisions (D-17 to D-22 APPROVED by the owner 2026-11-08; D-16 still PROPOSED)

| ID | Decision | Why / status |
|---|---|---|
| **D-16 (OPEN)** | Band thresholds in `src/rules/bands.v1.json` are **PROPOSED, pending owner review**: flat |A%| < 0.50; NEGATIVE at or below -5.00; POSITIVE at or above +5.00; minimum 2 successful instalments to classify; stage lower bounds 1/3/6/12 months; short-period XIRR note under 12 months; provider XIRR tolerance 50 bps. | They reuse the demo values from the clickable prototype and fixture sanity check. They are product-judgement parameters, not research findings and not advice. **Owner must set or confirm every value** (Phase 2 definition of done). The owner said not to finalise or promote them yet; the full review pack is `docs/band-thresholds-review.md`. The file and the tests state PROPOSED. |
| **D-18 (APPROVED)** | Classification compares the **displayed 2 dp A%** (hundredths of a percent, half away from zero), not an unrounded value. | The label can never contradict the number the user sees (e.g. 0.50% shown is never labelled FLAT). Owner to confirm. |
| **D-17 (APPROVED)** | One rounding rule everywhere: **half away from zero**, integer (BigInt) arithmetic for money and percentages. | Avoids floating point for rupee figures and band boundaries; symmetric for gains and losses. |
| **D-19 (APPROVED)** | A valuation whose date differs from the as-of date is **not mixed in**: value, return and XIRR become unavailable and the case is flagged `VALUATION_DATE_MISMATCH`. No explanation may be generated from stale data. This supersedes `edge-cases.md` RC-E4b (show stale figures with date, MEDIUM), which has not been edited. A zero value against money invested is likewise treated as suspect and unavailable (`VALUATION_SUSPECT`, per RC-E2d). | "Never estimate": no silent use of a stale or future value. |
| **D-20 (APPROVED)** | New dependencies: `decimal.js` (XIRR Decimal arithmetic, as `architecture.md` section 6.2 specifies) and `tsx` (development only, runs `scripts/calc.ts`). Keep the dependency footprint minimal. | Both small, widely used. Run `npm audit` before deployment. |
| **D-21 (APPROVED)** | Tenure and XIRR cash-flow dates use each instalment's **settlement date** (`settledOn`), not its due date. | Money moved on the settlement date; a manually recovered instalment is counted when it was actually paid. |
| **D-22 (APPROVED, strongly)** | The returns engine reads only instalment amounts and dates and the valuation's current value. It never reads NAV, units or NAV history. | Illustrative NAVs cannot be mistaken for market data by the calculation. Enforced by a test that scrambles all NAV data and a source scan. The owner requires the NAV-scrambling regression test across all SIP fixtures to be preserved. |

## Deviations recorded

| Date | Deviation from earlier documents | Reason |
|---|---|---|
| 2026-11-08 | Stack moved from Next 14 / React 18 / Zod 3 / ESLint 8 / Vitest 2 to Next 16.4.5 / React 19 / Zod 4 / ESLint 9 flat config / Vitest 5 (Node 22.12+). | D-02, owner-approved; see `architecture.md` §17 |
| 2026-11-08 | `next lint` replaced by `eslint .`; `.eslintrc.json` replaced by `eslint.config.mjs`. | `next lint` no longer exists in Next 16 |
| 2026-11-08 | Phase 1 "seed script, migrations, idempotent seed" not built. | D-03 (no database) |
| 2026-11-08 | Persona count raised from 10 to 30. | D-13 |
| 2026-11-08 | Phase 2 spreadsheet vectors: no spreadsheet application was available, so Excel's `XIRR` has **not** been evaluated here. Independent values come from scipy + mpmath; one vector is Microsoft's published XIRR documentation example. The `.xlsx` has live `=XIRR()` formulas for the owner to recalculate. | No Excel or LibreOffice on the machine; stated openly in the gate file |
