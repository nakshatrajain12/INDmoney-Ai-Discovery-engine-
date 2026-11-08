# Implementation Log

Source plan: `docs/implementation-plan.md`. Each phase starts only after the previous gate (`docs/phase-gates/phase-N.md`) is signed off by the owner.

## Execution plan (reported before Phase 0)

| Phase | Builds | Main files | Gate |
|---|---|---|---|
| 0 | Setup, config, logging, errors, health, theme, CI | `package.json`, `src/lib/*`, `src/app/*`, `tests/unit/*` | Build, tests, live health, theme |
| 1 | Models, schemas, mock provider, ten persona fixtures, validator | `src/contracts`, `src/data/*` | Provider contract tests, fixtures consistent |
| 2 | Returns engine: invested, value, absolute, tenure, XIRR, classify, confidence | `src/domain/returns/*`, `src/domain/confidence/*` | Spreadsheet-verified XIRR vectors |
| 3 | Return Coach (templates first), sources, intent guard, refusal, orchestrator, API | `src/domain/explain/*`, `src/content/*` | Numeric consistency, 100% advice refusal, linter clean |
| 4 | Rules-based Debit Explainer | `src/domain/debit/*`, `src/rules/*` | One test per rule, determinism, no LLM import |
| 5 | Pause and Restart state machine, opt-in reminder, simulated scheduler | `src/domain/pause/*` | All transitions, no-opt-in property |
| 6 | UI from the approved Stitch designs, all states, both themes | `src/app/**` | E2E per persona, axe clean |
| 7 | Golden set, LLM rephraser (flag-gated), red-team, QA report, usability | `tests/golden`, `docs/evaluation-results.md` | Eval gate decision recorded |
| 8 | Deployment, runbook, demo script | `vercel.json`, `docs/runbook.md` | Live demo, rollback rehearsed |

**Conflicts to resolve before the phases they affect** (details in `docs/decisions.md`): D-04 evaluation-framework doc missing (blocks Phase 3), D-10 LLM role vs approved architecture (blocks Phase 3), D-02 Next 14 advisories (before Phase 8, better before Phase 1).

---

## Phase 0: Project setup and environment

**Date:** 2026-11-08 · **Status:** Complete, awaiting owner sign-off. Two decisions need you (D-02 before Phase 1 is wise; D-04 and D-10 before Phase 3).

### Implemented
- Next.js 14.2.35 (App Router), React 18.3, TypeScript strict (`noUncheckedIndexedAccess`), Tailwind 3.4 with the design-system tokens as CSS variables (dark default, light mode, `ind_theme` storage key).
- `src/lib/config.ts` (Zod, server-only, fail-fast), `logger.ts` (redaction), `errors.ts` and `api.ts` (calm error envelope, request ids), `clock.ts` (IST and demo clock), `banned-phrases.ts` (pressure and advice linter).
- `GET /api/v1/health`; placeholder page with a live backend check and theme toggle.
- ESLint rule that blocks deterministic code (`returns`, `debit`, `pause`, `confidence`, `sources`, `data`) from importing LLM code.
- Security headers, `.gitignore`, `.env.example`, README, GitHub Actions CI.

### Files created
`package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.js`, `tailwind.config.ts`, `.eslintrc.json`, `vitest.config.ts`, `.gitignore`, `.env.example`, `README.md`, `.github/workflows/ci.yml`; `src/app/{layout.tsx,page.tsx,globals.css}`, `src/app/components/{ThemeToggle,HealthStatus}.tsx`, `src/app/api/v1/health/route.ts`; `src/lib/{config,errors,logger,clock,api,banned-phrases}.ts`; `tests/unit/{health,architecture-boundary,security}.test.ts`, `tests/unit/lib/{config,logger,api,banned-phrases,clock}.test.ts`; `tests/live/phase0-live-check.js`; `docs/{decisions,implementation-log}.md`, `docs/phase-gates/phase-0.md`.

### Tests executed
| Check | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass, no warnings |
| `npm test` (Vitest) | **38 tests, 8 files, all pass** |
| `npm run build` | Pass (static `/`, dynamic `/api/v1/health`) |
| Live check against the production server (`tests/live/phase0-live-check.js`) | **26 checks, all pass** (corrected from an earlier miscount of 27) |

Live checks covered: server starts; health 200 with request id; LLM off by default; security headers; `x-powered-by` removed; unknown route 404; the page shows "Backend connected" (frontend to backend); dark default; theme toggle accessible name and 44 px size; persistence across reload with no flash; light and dark canvas colours; no secret or key name in HTML; no browser errors; invalid LLM config returns a calm `CONFIG_ERROR` without naming secrets; a real-looking key never appears in the API response, HTML or server logs.

### Acceptance criteria (implementation plan, Phase 0)
| Criterion | Evidence | Met |
|---|---|---|
| lint, type-check, test, build pass | See above | Yes locally; CI file added but **not yet run on GitHub** |
| Placeholder page renders in both themes; theme persists; no flash | Live check, screenshots | Yes |
| Importing LLM code from `domain/` fails lint | `architecture-boundary.test.ts` (5 failing-import cases, 2 allowed cases) | Yes |
| Banned-phrase linter fails on "act now", passes neutral text | `banned-phrases.test.ts` | Yes |
| `.env` untracked; `.env.example` has no secrets | `security.test.ts` | Yes (this folder is not its own Git repository yet; see issues) |
| README lets a new developer run the app in under 15 minutes | Written; **not timed with a second person** | Partly |
| Decision log filled; phase gate file | `docs/decisions.md`, `docs/phase-gates/phase-0.md` | Yes |

### Issues discovered
1. **Dependency advisories** (D-02): `npm audit --omit=dev` reports 1 critical (Next), 2 high (PostCSS bundled with Next, Zod 3). Fixes need Next 16.x or Zod 4.x (major upgrades). Not changed; needs your decision.
2. **`evaluation-framework.md` is a stub** (D-04), contradicting the master prompt's assumption.
3. **LLM role differs between the master prompt and the approved architecture** (D-10).
4. **This folder is not its own Git repository**; it sits inside the AI-engine repository (`git rev-parse` points at the parent). The nested `.gitignore` **is honoured** there (verified with `git check-ignore`: `node_modules` and `.env.local` are ignored), so secrets stay out. The GitHub Actions workflow only runs if the project becomes a repository root. Confirm where it should live.
5. CI workflow is untested on GitHub.
6. Server logs include raw error messages for unexpected errors (never shown to users). Our own errors contain no secrets, but a third-party error text could; acceptable for the prototype, revisit in Phase 8.

### Decisions made
D-01, D-03, D-05 to D-09 (see `docs/decisions.md`).

### Remaining work
Phases 1 to 8. Owner actions: sign off Phase 0; decide D-02; confirm D-04 (I draft the framework) and D-10 (my recommended resolution) before Phase 3; say where the project should live in Git.

---

## Phase 0 addendum: D-02 security upgrade (owner-approved 2026-11-08)

- Upgraded to Next 16.4.5, React 19, Zod 4.6.7, ESLint 9 (flat config), Vitest 5.1 (Vite 7, Node 22.12+), TypeScript 5.9.
- Next 16 changes handled: async `params`, no `next lint` (now `eslint .`), tsconfig auto-edit by the build. React 19 `set-state-in-effect` lint errors fixed by refactoring components.
- Final `npm audit`: production **0**; full **8 moderate** (dev ESLint chain), 0 high, 0 critical. npm's only suggested fix is a downgrade, so it was not applied and nothing was suppressed.
- Re-verified: typecheck, lint, tests, build, dev server, 26 live checks. Details in `architecture.md` section 17.
- Corrected the earlier "27 live checks" to 26.

---

## Phase 1: Data models and mock SIP data

**Date:** 2026-11-08 · **Status:** Complete, awaiting owner review (D-11, D-15).

### Implemented
- `src/lib/dates.ts`: ISO date helpers with UTC arithmetic, month-end clamping, due-date generation.
- `src/contracts/{domain,api}.ts`: Zod schemas for users, mandates, SIPs, instalments, valuations, payment failures, pauses, reminders, metrics, bundles, fixtures and API payloads.
- `src/data/status.ts`: derived SIP status (CANCELLED > PAUSED/RESTART_PENDING > PAYMENT_FAILED > ACTIVE); `RESTART_WINDOW_DAYS = 14`.
- `src/data/provider.ts` interface; `src/data/mock/{builders,fixtures,validate,MockProvider}.ts`; `src/data/index.ts`.
- 30 labelled demo personas (catalogue in `src/data/mock/README.md`); validator requires detected anomalies to equal declared ones.
- API: `GET /api/v1/personas`, `/api/v1/sips?persona=&asOf=`, `/api/v1/sips/[id]`. Raw data only; no computed metrics.

### Tests executed
| Check | Result |
|---|---|
| `npm run typecheck` / `npm run lint` | Pass |
| `npm test` | **156 tests, 14 files, all pass** |
| `npm run build` | Pass (routes: /, health, personas, sips, sips/[id]) |
| `tests/live/phase1-live-check.js` against the production server | **32 checks, all pass** |
| Independent Python re-derivation (invested, units, value, return, XIRR) | **0 mismatches** |

### Acceptance criteria
| Criterion | Evidence | Met |
|---|---|---|
| Models validated by schemas | Zod contracts; provider validates at construction | Yes |
| Mock data covers positive, flat, negative, short tenure, failures, pause, restart, cancel, missing data | 30 personas | Yes |
| Every failure category plus unknown and no-reason | 9 debit personas | Yes |
| Provider contract suite passes | `provider-contract.ts` | Yes |
| Data clearly labelled mock | `isMock`, `dataLabel`, `navSource`; live check | Yes |
| Seed script and migrations | Not applicable (D-03) | N/A |

### Issues discovered and fixed
1. `xirr-fails` did not fail (XIRR +49%); caught by independent Python check; redesigned; regression test added.
2. A pause past its end date was still derived as PAUSED; `deriveSipStatus` fixed.
3. `new-month-1` band expectation corrected to FLAT.

### Decisions made
D-12, D-13, D-14. Owner to confirm: D-11, D-15 (`docs/decisions.md`).

### Remaining work
Phases 2 to 8. Phase 2 (deterministic returns engine) starts after owner review.

---

## Phase 1 owner decisions (2026-11-08)

D-11 `RESTART_PENDING` approved; the status rule additionally rejects a restart date before the pause start, with boundary tests (13, 14, 15 days, past, open-ended, non-paused, invalid, reminder-only). D-15 fixtures **provisionally accepted, not fully reviewed or signed off**; fixtures preserved unchanged and their assumptions documented in `src/data/mock/README.md`. Owner authorised Phase 2 to proceed using the fixtures provisionally.

---

## Phase 2: Deterministic returns engine

**Date:** 2026-11-08 · **Status:** Engineering complete, awaiting owner review (D-16 thresholds, D-17 to D-22, CLI hand check). Gate file: `docs/phase-gates/phase-2.md`.

### Implemented
- `src/domain/returns/`: `money` (paise, BigInt percentages, Indian grouping), `returns`, `tenure`, `xirr` (decimal.js, bracketed Newton with bisection fallback), `classify`, `config` (Zod-validated rules), `engine` (`computeMetrics(bundle, asOf)` returns `FinancialMetrics` plus detail flags).
- `src/domain/confidence/confidence.ts`; `src/rules/bands.v1.json` (PROPOSED values); `scripts/calc.ts`.
- ESLint purity rules for `domain/returns` and `domain/confidence` (no I/O, clock, randomness, data layer, LLM code).
- `tests/fixtures/`: `xirr-vectors.json` (16), `xirr-vectors.xlsx`, `make_xirr_vectors.py`, `verify_personas.py`.
- Phase 1 follow-ups: D-11 tightened and tested; fixture README gained an assumptions and limitations section; fixtures untouched.

### Tests executed
| Check | Result |
|---|---|
| typecheck, lint | Pass |
| `npm test` | **340 tests, 19 files, all pass** (156 before Phase 2) |
| `npm run build` | Pass |
| `npm audit --omit=dev` | 0 vulnerabilities |
| `verify_personas.py` (independent Python) | **32 SIPs, 0 mismatches**; worst XIRR difference 0.000044 pp |
| Mutation checks | 2 deliberate bugs, both caught |

### Issues discovered and fixed during the phase
1. My own ESLint rule did not match the bare import `'@/data'`; a lint test caught it; pattern fixed.
2. A test expectation of mine was wrong (a quarterly SIP from 8 Feb 2026 has 4 instalments by 8 Nov, not 3); the engine was right.
3. The first mutation check was ineffective (failed rows have no settlement date, so they were excluded anyway); added a test with corrupt settlement dates on failed rows, then re-ran the mutation, which was caught.
4. The Microsoft XIRR example needed a 1e-6 tolerance, because engine output is rounded to 4 dp of a percent; stated in the test.

### Decisions made
D-16 to D-22 (`docs/decisions.md`). D-11 closed; D-15 still open.

### Mock-data limitations
All NAVs are invented; all figures demonstrate the calculation only. Excel's `XIRR` was not available and has not been run (vectors come from scipy and mpmath plus one Microsoft-published example). Bands are proposals.

### Remaining work
Owner review of Phase 2 and the final D-15 fixture review. Then Phase 3 (Return Coach explanation engine), which needs the content owner and compliance reviewer named and real source documents retrieved.

### Phase 2 review follow-up (2026-11-08)

- Owner approved D-17 to D-22 (D-22 strongly: the NAV-scrambling regression test across all SIP fixtures must be preserved). D-16 thresholds remain PROPOSED; D-15 final fixture sign-off pending.
- Decision numbering aligned with the owner's: D-17 is rounding, D-18 is displayed-figure classification.
- CLI `early-flat` executed (exit 0) and its actual output recorded in `docs/phase-gates/phase-2.md`; it matches the owner's hand calculation.
- New: `docs/band-thresholds-review.md` (every threshold, classification, explanation intent, boundary behaviour from the real engine, 8 decision points).
- Fixed a spec gap found while preparing it: zero current value with money invested is now `VALUATION_SUSPECT` (edge-cases RC-E2d). Tests: 342 pass; independent Python check re-run, 0 mismatches.
- Found and reported, not changed: the flat band is strict in code but inclusive in architecture 6.3 and RC-E2b (owner to choose).

---

## Phase 4: Rules-Based Debit Explainer

**Date:** 2026-11-09 · **Status:** Engineering complete, all Phase Gate 4 criteria verified.

### Implemented
- **Rules Matrix (`src/rules/debit-rules.v1.json`):** Versioned, deterministic mapping for all 7 failure categories: `UPI_DAILY_LIMIT`, `INSUFFICIENT_FUNDS`, `BANK_UNAVAILABLE`, `MANDATE_EXPIRED`, `MANDATE_REJECTED`, `NETWORK_TIMEOUT`, and `GENERIC_UNKNOWN`.
- **Contracts (`src/contracts/debit.ts`):** Zod schemas and TypeScript types for `DebitFailureCategory`, `DebitStatusChip`, `DebitAction`, `DebitDiagnosis`, `DebitEventSummary`, `RetryRequest`, and `RetryResult`.
- **Debit Engine Evaluator (`src/domain/debit/evaluator.ts`):** Pure, deterministic evaluation function mapping raw provider error codes to plain-language reasons, active status confirmations, and single next best actions.
- **Corner Case Safeguards (`src/domain/debit/`):**
  - **DE-E06 (Conflicting Signals):** Detects mismatch between provider code and message (e.g., funds vs. bank down), discards conflict, and routes to safe fallback.
  - **DE-E07 (Idempotency):** In-memory cache debounces repeated retry requests with identical `idempotencyKey`.
  - **DE-E08 (Auto-retry Notice):** Formats verified automated bank retry dates while allowing manual retry if supported.
  - **DE-E09 (Already Settled):** Rejects retries on settled instalments with HTTP 409 Conflict.
  - **DE-E10 (In-Flight Debits):** Disables retry button and displays in-progress status when payment is `PENDING`.
  - **DE-E11 (Consecutive Failures):** Detects $\ge 3$ consecutive failures and displays mandate verification warning.
- **Mandate & Status Guarantee:** Confirmed that failed debits never display the SIP as cancelled unless the mandate is explicitly revoked (`MANDATE_REJECTED` or mandate status `INACTIVE`).
- **Data Provider Extensions (`src/data/provider.ts`, `src/data/mock/MockProvider.ts`):** Added `getDebitEvent(eventId)` and `retryDebitEvent(eventId, idempotencyKey, asOf)`.
- **API Endpoints:**
  - `GET /api/v1/sips/{id}/debit-events`: Lists past debit events with status chips.
  - `GET /api/v1/debit-events/{id}/explain`: Detailed diagnosis endpoint (with alias `/api/v1/debit-events/{id}/explanation`).
  - `POST /api/v1/debit-events/{id}/retry`: Mock payment retry endpoint with idempotency support.

### Tests & Verification
| Check | Result |
|---|---|
| `npx tsc -p prototype/tsconfig.json --noEmit` | **Pass (0 errors)** |
| `npm run lint` | **Pass (0 warnings, 0 errors)** |
| `npm test` | **407 tests, 26 files, all pass** (including 32 new debit unit and API tests) |
| `npm run build` | **Pass (all static and dynamic routes compiled)** |
| Banned-phrase linter on rules copy | **0 violations** |

### Phase Gate 4 Checklist
- [x] Every mapped error code generates the correct human explanation and status chip.
- [x] Unmapped or unknown error codes trigger the safe fallback without failing.
- [x] Confirmation that a failed debit never displays the SIP as cancelled unless the mandate is explicitly revoked.


