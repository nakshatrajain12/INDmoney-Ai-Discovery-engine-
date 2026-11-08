# Implementation Plan: SIP Steady Prototype

**Status:** Draft v1 · **Date:** 2026-11-08 · **Inputs:** `product-requirements.md` (RC-, DE-, PR-, FS-, PV- IDs), `architecture.md`, `design-system.md`, `problem-statement.md`, `research-context.md`.

## How to use this plan

1. **Strict gating.** Phases run in order. **No phase starts until the previous phase's Definition of Done is signed off** (by the owner) and its checklist is stored in `docs/phase-gates/phase-N.md`. If a gate fails, fix it inside that phase. Do not carry defects forward and do not build parts of later phases early.
2. **Every phase ends in something demonstrable** without needing the UI. Phases 1–5 are validated through unit tests and a small CLI or API harness; Phase 6 integrates the UI.
3. **Paths** are relative to `prototype/`. They follow the structure in `architecture.md` §3.
4. **Scope rule:** only what the PRD marks P0 for R1, plus Module 3 (P1) because it is in the selected scope. Out-of-scope items (PRD §13) are not built.
5. **Honesty rule:** mock data is labelled "Demo data"; test results are recorded as measured; targets (e.g., ≥95%) are proposed until measured.
6. **Sizing** is in working days for one developer and is an **estimate [A]**, not a commitment.

## Phase overview

| Phase | Name | Est. days | Gate (summary) |
|---|---|---|---|
| 0 | Project setup and environment | 2 | Clean build, CI green, boundaries enforced |
| 1 | Data models and sample SIP data | 3 | Schema, seed, `MockProvider` tested |
| 2 | Return calculation engine | 4 | Formulas verified against independent calculation |
| 3 | Return Coach explanation engine | 5 | Templates, sources, refusal, fallback; no LLM required |
| 4 | Rules-based Debit Explainer | 3 | Deterministic, every rule tested |
| 5 | Pause and Restart | 4 | State machine and opt-in reminder verified |
| 6 | Frontend and UI integration | 6 | All screens, both themes, accessible |
| 7 | Testing and AI evaluation | 5 | Eval gate decision recorded |
| 8 | Deployment | 3 | Live demo, monitoring, rollback tested |
| | **Total** | **≈35** | |

---

## Phase 0: Project setup and environment

**Objective.** A reproducible repository where code, lint, type-check, tests and CI run, and architectural boundaries are enforced from day one.

**Tasks**
1. Initialise Next.js (App Router) with TypeScript strict mode and Tailwind 3.4. *(Updated 2026-11-08 under D-02: built on Next 14.2.24, then upgraded to Next 16.4.5 / React 19 for security; see `architecture.md` §17.)*
2. Create the folder layout from `architecture.md` §3 (`src/domain`, `src/data`, `src/contracts`, `src/content`, `src/rules`, `src/lib`, `tests/`).
3. Port the design tokens: `tailwind.config.ts` colours/radii/shadows and the CSS variable block from the engine, plus the light-mode text variants (`design-system.md` §3.3, §9).
4. Add dependencies, minimal and pinned: `zod`, a test runner (Vitest), Playwright, an ORM (Prisma or Drizzle), `decimal.js` (or equivalent) for XIRR, `eslint` plus an import-boundary plugin, `lucide-react`, `clsx`, `tailwind-merge`.
5. Configure lint rules: (a) `domain/*` must not import `explain/rephraser` or any LLM code; (b) no floating-point money; (c) banned-phrase and pressure-language linter for `content/` and UI strings (initial banned list from PRD §5.4).
6. Environment handling: `.env.example` (no values; keys `LLM_ENABLED`, `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY`, `DATABASE_URL`, `DEMO_PANEL`, `APP_ENV`), runtime config loader with zod validation.
7. Set up the theme mechanism: inline pre-paint script, `ind_theme` storage key, default dark, toggle component stub.
8. CI (GitHub Actions): install, lint, type-check, unit tests, build.
9. Git hygiene: `.gitignore` (`.env`, `node_modules`, `.next`), branch strategy, commit template, `CODEOWNERS` if used.
10. Decision log: `docs/decisions.md` with hosting, database, LLM yes/no (default: no in R1).

**Files to create or modify**
`package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.js`, `src/app/layout.tsx`, `src/app/globals.css`, `.eslintrc.cjs`, `eslint-rules/` (custom rules), `.github/workflows/ci.yml`, `.env.example` (update), `src/lib/config.ts`, `src/lib/errors.ts`, `src/lib/clock.ts`, `README.md` (setup steps), `docs/decisions.md`, `docs/phase-gates/phase-0.md`.

**Dependencies.** None. Needs: a Node LTS version, a GitHub repository, owner decisions on hosting and database.

**Acceptance criteria**
- `npm run lint`, `type-check`, `test`, `build` pass locally and in CI.
- The app renders a placeholder page in both dark and light mode, theme persists across reload, no flash of the wrong theme.
- A deliberate violation (importing LLM code from `domain/`) fails lint.
- The banned-phrase linter fails on a sample sentence containing "act now" and passes on a neutral one.
- `.env` is untracked; `.env.example` contains no secrets.

**Testing requirements.** Smoke test for the config loader (missing and invalid variables fail fast); lint-rule tests; one Playwright test toggling the theme.

**Definition of done.** CI green on `main`; README lets a new developer run the app in under 15 minutes; decision log filled; phase-0 gate file signed.

---

## Phase 1: Data models and sample SIP data

**Objective.** A typed, validated data layer and a mock provider with scenario fixtures, so every later phase has realistic, labelled inputs without any INDmoney API.

**Tasks**
1. Define TypeScript types and zod schemas for `Sip`, `Instalment`, `Valuation`, `DebitEvent`, `PauseRecord`, `ReminderPref`, `Source`, `Passage`, `RuleSet`, `ExplanationLog`, `Feedback` (`architecture.md` §4). Money as integer paise; dates as ISO.
2. Write the DB schema and migration; repositories with an in-memory implementation for tests.
3. Define `SipDataProvider` (interface in `architecture.md` §13) and its capability flags.
4. Build `MockProvider` plus fixtures for the ten personas (early-flat, positive, new-month-1, long-tenure, debit-upi-limit, debit-unknown, debit-mandate-expired, cashflow-pause, quarterly, missing-xirr). Every fixture is labelled `is_mock: true` and described in a README.
5. Build a seed script and a **demo clock** (`lib/clock.ts`) so "today" can be set without editing fixtures.
6. Write a fixture validator (checks schema, date ordering, instalment counts, status consistency).
7. Document fixtures: what each persona is for, which PRD requirement it exercises. State that fixtures are illustrative and not research data.

**Files to create or modify**
`src/contracts/*.ts`, `src/data/provider.ts`, `src/data/mock/MockProvider.ts`, `src/data/mock/fixtures/*.json`, `src/data/mock/README.md`, `src/data/db/schema.*`, `src/data/db/repositories/*.ts`, `src/data/db/seed.ts`, `src/lib/clock.ts`, `tests/unit/data/*.test.ts`, `docs/phase-gates/phase-1.md`.

**Dependencies.** Phase 0 complete. Database choice from the decision log.

**Acceptance criteria**
- All fixtures pass schema validation and consistency checks.
- `MockProvider` returns the same data for the same persona and clock, and respects the demo clock.
- Seed runs on an empty database and is idempotent.
- No fixture contains a name, contact detail, account number or PAN.
- Money fields are integers everywhere (a test fails on any float).

**Testing requirements.** Unit tests: schema accept/reject cases; fixture validity (all ten); provider contract tests (the same suite will later run against any real provider); seed idempotency; clock behaviour.

**Definition of done.** Provider contract suite passes; fixtures reviewed by the owner for plausibility and labelling; migrations apply cleanly; gate file signed.

---

## Phase 2: Return calculation engine

**Objective.** A pure, fully tested engine that computes invested amount, current value, absolute return, tenure, XIRR, situation and confidence, and never estimates.

**Tasks**
1. `money.ts`: paise arithmetic, Indian-grouping formatter (shared with placeholder substitution in Phase 3).
2. `returns.ts`: invested, absolute return in ₹ and % (rounded half-up for display).
3. `tenure.ts`: months from the first successful instalment, instalment counts, stage (`M1`, `M1_3`, `M3_6`, `M6_12`, `OVER_12`), including daily, weekly, monthly and quarterly SIPs.
4. `xirr.ts`: Decimal-based solver (bracketed bisection plus Newton), 365-day basis, tolerance and iteration cap, returns `null` on <2 flows, same-sign flows or non-convergence; flag short-period annualisation.
5. Provider-XIRR reconciliation: tolerance config; `xirrMismatch` flag.
6. `classify.ts` plus `rules/bands.v1.json`: situation from `A%`, tenure and instalment count; thresholds are config entries with a status field. **The owner must set and review the values.** None is treated as research output.
7. `confidence.ts`: deterministic label per `architecture.md` §6.4.
8. A thin CLI (`scripts/calc.ts`) that prints the full calculation for any persona for manual checking.
9. Independent verification: compute XIRR for at least 10 cases in a spreadsheet (e.g., the spreadsheet's `XIRR` function) and store them as test vectors with the spreadsheet file in `tests/fixtures/`.

**Files to create or modify**
`src/domain/returns/{money,returns,tenure,xirr,classify}.ts`, `src/domain/confidence/confidence.ts`, `src/rules/bands.v1.json`, `scripts/calc.ts`, `tests/unit/returns/*.test.ts`, `tests/fixtures/xirr-vectors.{json,xlsx}`, `docs/phase-gates/phase-2.md`.

**Dependencies.** Phase 1 complete (types, fixtures, provider).

**Acceptance criteria**
- Absolute return and invested amounts match hand calculation on all ten personas.
- XIRR matches the independent spreadsheet vectors within a stated tolerance (record the tolerance).
- `xirr` returns `null` (not a number) for single flow, same-sign flows and non-converging inputs.
- Tenure stage boundaries are correct on, one day before and one day after each boundary.
- Failed instalments never enter `invested`.
- Quarterly and daily SIPs produce correct instalment counts and tenure.
- No function in `domain/returns` performs I/O or imports from `explain/` (lint-enforced).
- `confidence.ts` returns HIGH / MEDIUM / LOW exactly per the rule table (table-driven tests).

**Testing requirements.** Table-driven unit tests; property tests (e.g., XIRR monotonic in terminal value; scaling all flows leaves XIRR unchanged); boundary-date tests; determinism test (same input, identical output 100×); no floating-point money test.

**Definition of done.** All tests green; spreadsheet vectors reproduced; band thresholds set, reviewed and committed with a note on who set them and why; CLI output reviewed by the owner against one case by hand; gate file signed.

---

## Phase 3: Return Coach explanation engine

**Objective.** Produce, for any persona, a complete Return Coach response (figures, three explanation blocks, term definitions, sources, confidence, disclaimer, refusal and fallback) **from templates only**. The LLM rephraser comes later and is optional.

**Tasks**
1. **Content library:** authored, reviewed text for `content/templates/` (blocks *Your figures*, *What this means at month N*, *What it does not mean*), keyed by situation and stage; vetted term definitions (XIRR, absolute return, NAV, volatility, unrealised vs realised) with the XIRR short-period note.
2. **Sources:** retrieve and read real documents (AMFI, SEBI, an AMC factsheet, INDmoney help); create `Source` and `Passage` entries with title, publisher, URL, dates, reviewer. **No entry from memory.** Only `VERIFIED` entries are selectable.
3. Placeholder renderer: tokens such as `{{invested}}` substituted using the Phase 2 formatter; fails the build if a template references an unknown token.
4. Deterministic source selection by topic, situation, stage; "no verified source for a general statement" → fallback.
5. **Intent guard (R1):** fixed intents only (`EXPLAIN_RETURN`, `EXPLAIN_TERM`, `WHAT_IS_NORMAL`). Build the advice-pattern detector and the **static** refusal and not-sure templates (needed now for R2 and for tests).
6. **Pressure-language and banned-phrase linter** extended and run over all content.
7. Orchestrator `coach(sipId, intent)`: provider → returns → classify → confidence → sources → templates → response; writes an audit record (masked).
8. Route handlers: `POST /api/v1/sips/{id}/coach`, `GET /api/v1/terms/{key}`, `GET /api/v1/sources`, `GET /api/v1/sips/{id}`.
9. Harness: `scripts/coach.ts <persona>` prints the full response.
10. **Do not** build the LLM rephraser in this phase. Create only its interface and a `NoopRephraser`.

**Files to create or modify**
`src/content/templates/*.json|ts`, `src/content/terms.ts`, `src/content/refusal.ts`, `src/content/banned-phrases.ts`, `src/domain/sources/{library,select}.ts`, `src/domain/explain/{orchestrator,templates,intent-guard,rephraser}.ts`, `src/app/api/v1/sips/[id]/coach/route.ts`, `src/app/api/v1/terms/[key]/route.ts`, `src/app/api/v1/sources/route.ts`, `src/app/api/v1/sips/[id]/route.ts`, `src/contracts/coach.ts`, `scripts/coach.ts`, `eslint-rules/banned-phrases.cjs`, `tests/unit/explain/*.test.ts`, `docs/content-review-log.md`, `docs/phase-gates/phase-3.md`.

**Dependencies.** Phase 2 signed off. Content owner and compliance reviewer named. Real source documents retrieved.

**Acceptance criteria**
- For every persona the Coach returns a schema-valid response or the deterministic fallback; `INSUFFICIENT_DATA` personas produce the fallback with confidence LOW.
- Every number in any response equals a figure produced by the engine (automated check: extract numerals from final text and compare to the figure set).
- Every general statement has at least one `VERIFIED` source; otherwise the fallback is served.
- Advice prompts (should I stop/continue/sell/buy/switch, which fund, will it recover, what would you do) return the fixed refusal in 100% of the test set.
- Disclaimer is present in every response.
- No content string fails the banned-phrase or pressure-language linter.
- XIRR term definition includes the short-period note.
- No import of any LLM client anywhere in this phase's code.

**Testing requirements.** Unit tests per template and per persona; numeric-consistency test; advice-pattern test set (≥40 phrasings including indirect forms, written before looking at results); fallback tests; linter tests; contract tests for routes; content review log signed by the reviewer.

**Definition of done.** Owner and content reviewer have read every template and source; zero linter violations; harness output reviewed on all personas; gate file signed. **The Coach is fully usable without an LLM at this point.**

---

## Phase 4: Rules-based Debit Explainer

**Objective.** A deterministic engine that explains a failed debit with reason, SIP status, next action and retry information, with no model involvement.

**Tasks**
1. Define the rule-row schema (`architecture.md` §8.2) and `rules/debit-rules.v1.json` with the **illustrative** reason categories (insufficient balance, UPI limit exceeded, mandate expired or inactive, bank declined, technical error, unknown). Mark clearly that real provider codes replace these.
2. Template content for reasons, status lines and actions (content review and linter apply).
3. `evaluate(event, sip, today)`: lookup, status state table, retry info, action feasibility, output assembly.
4. **Consequence notes** (bank charges, consecutive-failure cancellation): add only with a verified source; leave the consecutive-failure threshold `null` until verified, so no "at risk" status is produced.
5. Routes: `GET /api/v1/sips/{id}/debit-events`, `GET /api/v1/debit-events/{id}/explanation`, `POST /api/v1/debit-events/{id}/retry` (mock; only when `manual_retry_allowed`).
6. Audit logging (rule version, reason code, template IDs).
7. Harness: `scripts/debit.ts <persona>`.
8. Rules validation at boot (schema, every referenced template exists, every `verifiedBy` source is `VERIFIED`).

**Files to create or modify**
`src/rules/debit-rules.v1.json`, `src/domain/debit/{evaluate,status,rules-loader}.ts`, `src/content/debit-templates.ts`, `src/app/api/v1/sips/[id]/debit-events/route.ts`, `src/app/api/v1/debit-events/[id]/{explanation,retry}/route.ts`, `src/contracts/debit.ts`, `scripts/debit.ts`, `tests/unit/debit/*.test.ts`, `docs/phase-gates/phase-4.md`.

**Dependencies.** Phase 3 signed off (templates infrastructure, linter, sources, audit log). Phase 1 personas for debits.

**Acceptance criteria**
- Every rule row has a test; unknown codes return the generic message plus support action; no guessed reason.
- Output is byte-identical for identical input and rule version (100× repetition).
- No text mentions a fee, a penalty, a cancellation threshold or a deadline unless the rule row references a verified source.
- The status line is one of the defined states and is consistent across the explanation and the SIP detail.
- Exactly one primary action is returned; secondary is optional; infeasible actions are not shown.
- Retry info appears only when the provider data supplies it; manual retry appears only if allowed.
- A test fails the build if `domain/debit` imports any LLM or network code.
- Rules file with an unverified referenced source fails boot validation.

**Testing requirements.** Unit tests per rule; determinism; unknown-code; retry combinations; mandate states; contract tests; linter over debit templates.

**Definition of done.** All tests green; content and rules reviewed; any consequence note has a verified source (or is absent); gate file signed.

---

## Phase 5: Pause and Restart functionality

**Objective.** A validated state machine for pause, resume, extend and cancel with user-selected dates and an opt-in, single, non-pressuring reminder.

**Tasks**
1. State machine per `architecture.md` §9.1 (`ACTIVE`, `PAUSE_SCHEDULED`, `PAUSED`, `ACTIVE` on resume, `CANCELLED` terminal), server-side transition validation, `409` on illegal transitions.
2. Skipped-instalment handling: instalments inside a pause window become `SKIPPED`, never `FAILED`.
3. Options content (pause, reduce, cancel) from approved templates, with mandate or charge statements only if verified.
4. Provider capability handling (`pauseWithDate`, `pauseMandate`); the options explainer adapts to what the provider supports.
5. Reminder preference: default off; opt-in creates exactly one reminder at the user-chosen time and channel; no escalation or repeat.
6. Reminder content: static template (status plus Resume, Extend, Leave paused); linted for pressure language.
7. Scheduler endpoint and job: idempotent (`sent_at` guard); `NotificationChannel` interface with `InAppChannel` (inbox) and a mock channel; demo-clock-driven.
8. Routes: `POST /api/v1/sips/{id}/pause`, `PATCH /api/v1/pauses/{id}`, `GET /api/v1/sips/{id}/options`, `PUT /api/v1/pauses/{id}/reminder`, internal reminder runner.
9. Undo support before the pause starts and immediately after, where the provider allows.
10. Audit events for every transition and reminder.
11. Harness: `scripts/pause.ts` to run scenarios on a persona.

**Files to create or modify**
`src/domain/pause/{state-machine,scheduler,reminders,options}.ts`, `src/data/db/repositories/pause.ts`, `src/content/pause-templates.ts`, `src/lib/notifications/{channel,in-app,mock}.ts`, `src/app/api/v1/sips/[id]/{pause,options}/route.ts`, `src/app/api/v1/pauses/[id]/{route,reminder/route}.ts`, `src/app/api/internal/reminders/run/route.ts`, `src/contracts/pause.ts`, `scripts/pause.ts`, `tests/unit/pause/*.test.ts`, `docs/phase-gates/phase-5.md`.

**Dependencies.** Phase 4 signed off. Phase 1 `cashflow-pause` persona and provider capabilities. Phase 3 linter and template infrastructure.

**Acceptance criteria**
- Every legal transition succeeds and writes an audit event; every illegal transition returns `409` without changing state.
- With no opt-in, **no** reminder is created or sent (test across the full lifecycle).
- With opt-in, exactly one reminder is sent, at the chosen time, once, even if the scheduler runs repeatedly or crashes mid-run.
- A pause never auto-resumes unless the user chose an end date, and the confirmation says so.
- No option is preselected or ranked in the options response.
- Reminder text passes the pressure-language linter and contains three equal actions.
- Instalments in a pause window are `SKIPPED`.
- If `pauseMandate=false`, the options response states what happens instead.

**Testing requirements.** State-machine table tests (all pairs); scheduler idempotency and crash-recovery tests; no-opt-in property test; linter test on reminders; contract tests; demo-clock tests.

**Definition of done.** All tests green; a full pause-resume scenario run from the harness reviewed by the owner; gate file signed.

---

## Phase 6: Frontend and UI integration

**Objective.** A complete, accessible UI for the three modules in dark and light mode, integrated with the verified APIs.

**Tasks**
1. Shared components per `design-system.md` §6.1: `AppHeader`, `ThemeToggle`, `SipHeroCard`, `StatusChip`, `ConfidenceBadge`, `SourceRow`, `DisclaimerBar`, `NotSureCard`, "Demo data" chip.
2. Screens: `/` (personas and SIP list), `/sip/[id]`, `/sip/[id]/coach`, `/sip/[id]/debit/[eventId]`, `/sip/[id]/pause`, `/about`.
3. Coach UI: explanation card (figures → means → does not mean), term sheets, source rows, confidence badge, refusal and not-sure states, feedback row.
4. Debit UI: failure card (why / still active? / what next), status chip, primary action, retry info, history list.
5. Pause UI: options cards (none preselected), date picker, opt-in reminder toggle (off by default), confirmation with undo, reminder inbox and the three equal actions.
6. Demo panel (flag-gated): persona picker, demo clock, forced failure reason, LLM toggle (disabled until Phase 7), "How we worked this out" payload viewer.
7. Response validation with zod before render; deterministic fallbacks for every API failure; loading and empty states.
8. Light and dark theme verified for every component; light-mode text variants applied; **no coral on flat or negative returns**.
9. Accessibility pass: focus ring, keyboard paths, screen-reader labels, 44 px targets, reduced motion.
10. Capture screens in both modes into `clickable-prototype/screens/` and write `clickable-prototype/prototype-notes.md`.

**Files to create or modify**
`src/app/**/page.tsx`, `src/app/components/*.tsx` (list above), `src/app/globals.css`, `src/lib/api-client.ts`, `src/lib/format.ts`, `clickable-prototype/screens/*.png` (`<screen>-dark.png`, `<screen>-light.png`), `clickable-prototype/prototype-notes.md`, `tests/e2e/*.spec.ts`, `docs/phase-gates/phase-6.md`.

**Dependencies.** Phases 3, 4, 5 signed off; design system; component list from Phase 3-5 contracts.

**Acceptance criteria**
- Every persona can complete its task end to end (Coach, Debit, Pause) using only the UI.
- Both themes render every screen correctly at 360, 768 and 1280 px; theme persists; no flash.
- Every Coach surface shows disclaimer, source and confidence without scrolling at 360 px.
- Status is conveyed by icon plus text everywhere.
- Contrast checks pass for every pair used (see `design-system.md` §3.3).
- Keyboard-only completion of each flow works; focus returns to the trigger after a sheet closes.
- All displayed figures come from API responses (no figures computed in the client).
- API failure shows the standard SIP view plus the Not-sure card, never a blank or alarming error.

**Testing requirements.** Playwright E2E per persona in both themes and three viewports; automated accessibility scan (axe) with zero serious issues; visual regression snapshots; keyboard-path tests; manual screen-reader pass recorded; a test that fails if the client computes a financial figure.

**Definition of done.** E2E and accessibility suites green; screenshots captured in both modes; owner walkthrough passed; gate file signed.

---

## Phase 7: Testing and AI evaluation

**Objective.** Establish measured evidence that the system is correct and safe, and decide, on measured results, whether the optional LLM rephraser may ship.

**Tasks**
1. **Build the golden set** (~40 hand-labelled scenarios: ~20 return situations incl. edge cases, ~20 debit cases, plus advice-seeking prompts). Two labellers; labelling done **blind** to any model output; record agreement. This replaces the engine's hard-coded 20-item set, which is not usable.
2. Evaluate the **template-only** system on the golden set first (this is the baseline and the shipping default).
3. **Implement the LLM rephraser** (architecture §7): placeholder contract, no-digit rule, validator, fallback, prompt versioning, provider client; flag-gated, default off.
4. Evaluate the rephraser: rule-question correctness, placeholder integrity, **0 digits and 0 invented figures/fees**, banned-phrase and advice-pattern pass rate, refusal rate on advice prompts, fallback behaviour, latency and cost.
5. **Red-team set** (written before running): indirect advice, prediction extraction, injection attempts, Hinglish variants (only to learn; not a launch claim).
6. Load and failure-injection tests: provider down, DB slow, LLM timeout/5xx, malformed LLM output.
7. Security checks: dependency audit, header check, secret scan, rate-limit test.
8. **Usability test plan execution** with at least 3 target users (first-year investors), on a real task; record observations as they are; no fabricated or smoothed results (`usability-testing-plan.md`).
9. Write `docs/evaluation-results.md`: numbers, tolerances, failures, decision on `LLM_ENABLED`.
10. Fix defects within the owning phase's code; re-run affected suites.

**Files to create or modify**
`tests/golden/{return,debit,advice}.json`, `tests/golden/labeller-agreement.md`, `tests/eval/run.ts`, `tests/redteam/*.json`, `src/domain/explain/{rephraser,validator,llm-client}.ts`, `src/content/prompts/*.md`, `tests/unit/explain/validator.test.ts`, `tests/load/*`, `docs/evaluation-results.md`, `docs/usability-results.md`, `docs/phase-gates/phase-7.md`.

**Dependencies.** Phase 6 signed off. LLM provider and zero-retention terms decided. Labellers and test participants available.

**Acceptance criteria** *(targets are proposed; the outcome is whatever is measured)*
- Template-only system: ≥95% correct on rule questions; **100% refusal** on advice prompts; **0** invented numbers, fees or limits; correct fallback on all low-confidence cases.
- LLM rephraser enabled only if it meets the **same thresholds** and the validator rejects 100% of seeded digit/fee/advice injections. Otherwise it stays disabled and the product ships on templates, which is an acceptable outcome.
- Failure-injection: no user-visible error and no incorrect figure under any injected failure.
- Usability: at least 3 target users attempt a real task; observed outcomes and changes made are documented exactly as observed.
- Security checks pass with no high-severity findings.

**Testing requirements.** Everything above; every eval run is stored in `EvalRun` with the commit hash; results are reproducible by one command.

**Definition of done.** `docs/evaluation-results.md` and `docs/usability-results.md` committed with real results; the `LLM_ENABLED` decision recorded with the evidence; all defects fixed or logged with severity; gate file signed.

---

## Phase 8: Deployment

**Objective.** A live, monitored, rollback-ready demo that a mentor can use to attempt a real task.

**Tasks**
1. Provision hosting (Vercel), managed Postgres, environment variables per environment; separate keys for preview and production.
2. Run migrations and seed demo data in production; verify the "Demo data" chip is on every screen.
3. Configure feature flags (`LLM_ENABLED` per Phase 7 decision, `DEMO_PANEL`, `MODULE_PAUSE_ENABLED`, `FREE_TEXT_ENABLED` = off).
4. Security: HTTPS/HSTS, CSP and headers, rate limiting, secret scan, protected internal routes (reminder runner secret).
5. Scheduler: Vercel Cron for the reminder runner; verify idempotency live.
6. Observability: structured logs with `requestId`, error tracking, counters for fallback rate, refusals, validator rejections, latency; a simple dashboard.
7. CI/CD: deploy on `main` only after lint, tests, eval gate and build pass; preview deployment per pull request.
8. Rollback plan and rehearsal; backup and restore of the database; documented runbook (`docs/runbook.md`).
9. Smoke tests against production (all personas, both themes); performance check against the PRD latency targets (proposed).
10. Update `README.md` with the live URL, the demo script (which persona shows which flow), and the known limitations; record the final screenshots.

**Files to create or modify**
`vercel.json`, `.github/workflows/deploy.yml`, `src/middleware.ts` (rate limit, headers), `next.config.mjs` (headers), `docs/runbook.md`, `docs/demo-script.md`, `README.md`, `clickable-prototype/prototype-notes.md`, `tests/smoke/*.spec.ts`, `docs/phase-gates/phase-8.md`.

**Dependencies.** Phase 7 signed off (including the LLM decision). Hosting and database accounts. Domain or URL decision.

**Acceptance criteria**
- The production URL is reachable over HTTPS; every persona works in both themes.
- Smoke tests pass against production; the deploy pipeline blocks on a failing eval gate (demonstrated once with a deliberate failure).
- Reminder runner is idempotent in production (run twice, one message).
- Rollback to the previous release completes within a rehearsed time; database restore verified.
- Secrets are absent from the repository, build logs and client bundle (scan).
- Dashboards show fallback rate, refusal rate, validator rejections and latency; alerts exist for error spikes.
- Latency at or below the proposed targets (record measured values).
- "Demo data" chip and the "Not investment advice" disclaimer are visible on the right screens.

**Testing requirements.** Production smoke suite; header and TLS check; rollback rehearsal; backup-restore test; manual run-through of the demo script by someone other than the developer.

**Definition of done.** Live URL in README; runbook and demo script committed; a second person completed the demo script unaided; gate file signed. **The project then returns to the owner for the usability tests and deck slides 8–10.**

---

## Cross-phase rules

- **Change control.** If a phase reveals a PRD or architecture gap, update those documents first (with a dated note), then continue.
- **Evidence and claims.** No claim about retention impact appears in any document, UI string or demo script; the prototype demonstrates an experience, not an outcome.
- **No real data.** No phase uses real customer data, names, contact details, account numbers or PAN.
- **Content provenance.** Every source and passage traces to a retrieved document; no entry is invented.
- **Traceability.** Each pull request names the PRD IDs it implements; `docs/phase-gates/phase-N.md` records the checklist, test results, reviewer and date.
- **Risks to watch:** the content library (real sources) and the band thresholds are on the critical path of Phases 2–3; the golden set and labellers gate Phase 7; provider reason codes and capabilities block any later real-data integration.

## Phase gate template (`docs/phase-gates/phase-N.md`)
```
Phase N: <name>        Date: ____     Reviewer: ____
[ ] All tasks complete                [ ] All acceptance criteria met (evidence linked)
[ ] Tests green (CI link)             [ ] Lint/boundary rules green
[ ] Documents updated (PRD/arch if changed)   [ ] Known issues logged with severity
Decision: PASS / FAIL    Notes: ____
```
