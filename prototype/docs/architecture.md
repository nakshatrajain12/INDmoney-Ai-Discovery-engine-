# Architecture: SIP Steady Prototype

**Status:** Draft v1.1 (stack upgraded to Next.js 16 on 2026-11-08, see §17) · **Date:** 2026-11-08 · **Inputs:** `problem-statement.md`, `product-requirements.md` (PRD; IDs like RC-1, DE-2, PR-5 refer to it), `design-system.md`.

**Purpose:** a functional, demonstrable prototype of the three modules (Return Coach, Debit Explainer, Pause and Restart) that runs on **mock SIP data**, needs **no access to INDmoney internal APIs**, and can later swap in real data without changing the core logic.

**Labels:** **[REQ]** requirement · **[A]** assumption · **[D]** design decision.

---

## 0. Architectural principles

1. **Deterministic core, generative edge.** Every number, date, status, rule outcome, source choice, confidence label and refusal is produced by code. A language model may only *phrase* vetted content. The model is optional: the product must work with templates alone (RC §5.2).
2. **The LLM never sees a chance to invent a figure.** It receives named facts and returns text containing *placeholders*; the server substitutes the real values. Digits in model output are rejected (§6).
3. **Data behind an interface.** All SIP data enters through one `SipDataProvider` interface. R1 ships a mock provider; a future INDmoney provider implements the same interface.
4. **Fail safe, never guess.** Any validation failure, missing input or low confidence ends in a fixed, deterministic fallback (RC-10).
5. **Auditable.** Every explanation is reproducible from stored inputs, rule version, template ID and source IDs.
6. **Same design family as the AI engine.** Next.js App Router, TypeScript, Tailwind 3.4, `lucide-react`, Vercel hosting. The prototype runs **Next.js 16.4.5 / React 19** (upgraded for security, §17) while the existing engine remains on Next 14; design tokens and components (`design-system.md`) transfer unchanged because they are CSS variables and Tailwind classes.

---

## 1. System overview

```
┌──────────────────────────── Browser (Next.js, dark/light) ────────────────────────────┐
│  Screens: SIP overview · Return Coach · Debit Explainer · Pause & Restart · Dev panel │
└───────────────▲──────────────────────────────────────────────────────┬───────────────┘
                │ JSON (typed contracts, zod-validated)                │ theme in localStorage
┌───────────────┴──────────────────────  Next.js Route Handlers (/api/v1) ──────────────┐
│                                                                                        │
│  ┌──────────────┐   ┌──────────────────┐   ┌───────────────┐   ┌───────────────────┐  │
│  │ Orchestrator │──▶│ DETERMINISTIC     │   │ GENERATIVE     │   │ Content & Sources │  │
│  │ (per request)│   │ CORE              │   │ EDGE (optional)│   │ library (verified)│  │
│  │              │   │ • Return engine   │   │ • Intent guard │   └─────────▲─────────┘  │
│  │              │   │ • Tenure/classify │   │ • Rephraser    │             │            │
│  │              │   │ • Debit rules     │   │ • Validator    │             │            │
│  │              │   │ • Pause state m/c │   └───────▲───────┘             │            │
│  │              │   │ • Confidence rule │           │ facts + approved text only         │
│  └──────┬───────┘   └────────┬─────────┘           │                                    │
│         └────────────────────┴─────────────────────┘                                    │
│                         │                                                                │
│        ┌────────────────┴────────────────┐          ┌────────────────────────────┐     │
│        │ SipDataProvider (interface)      │          │ Explanation / audit log     │     │
│        │  • MockProvider  (R1)            │          │ (PII-masked)                │     │
│        │  • IndmoneyProvider (future)     │          └────────────────────────────┘     │
│        └────────────────┬────────────────┘                                              │
└─────────────────────────┼────────────────────────────────────────────────────────────────┘
                          ▼
              Postgres (mock users, SIPs, events, pauses, reminders, sources, logs)
                          ▲
              Optional external LLM API (server-side only)
```

---

## 2. Frontend architecture

| Aspect | Decision |
|---|---|
| Framework | **Next.js 16.4.5 (App Router, Turbopack), React 19**, TypeScript 5.9 (strict), Tailwind 3.4 with the engine's tokens; `lucide-react` icons. Zod 4 for validation. See §17. |
| Rendering | Server Components for screens that read data; Client Components for interactive parts (theme toggle, date pickers, feedback, term bottom sheets). |
| State | Server state through route handlers and `fetch` with `cache: 'no-store'`; local UI state with React state; no global store needed. Theme in `localStorage["ind_theme"]` as in the engine. |
| Design | `design-system.md`: dark default, light mode, variable-driven tokens, tabular numerals, mobile-first. |
| Validation | `zod` schemas shared with the backend (`src/contracts/`); runtime-validate every API response before render. |
| Resilience | Every Coach/Explainer card has a deterministic template path; if an API call fails the screen shows the standard SIP view plus the Not-sure card, never a blank or error colour. |
| Accessibility | Per `design-system.md` §8. |
| Dev tools | A **Demo panel** (hidden behind a flag): choose a mock persona, set the **demo clock**, force a failure reason, toggle LLM on/off, and view the structured "How we worked this out" payload. |

**Screens (R1)**

| Route | Purpose | Modules |
|---|---|---|
| `/` | Persona picker (demo) and SIP list | n/a |
| `/sip/[id]` | SIP overview: hero card, status chip, actions | all |
| `/sip/[id]/coach` | Return Coach | Module 1 |
| `/sip/[id]/debit/[eventId]` | Debit Explainer | Module 2 |
| `/sip/[id]/pause` | Pause and Restart | Module 3 |
| `/about` | How it works, sources, disclaimer | n/a |

**Component map:** `AppHeader`, `ThemeToggle`, `SipHeroCard`, `StatusChip`, `ConfidenceBadge`, `SourceRow`, `DisclaimerBar`, `NotSureCard`, `CoachExplanation`, `TermSheet`, `FeedbackRow`, `FailureCard`, `NextActionButton`, `OptionCards`, `PauseForm`, `ReminderToggle`, `DemoPanel`.

---

## 3. Backend architecture

**[D]** A single Next.js deployment, with route handlers as the API and plain TypeScript modules as the domain layer. No separate service is needed for a prototype; the domain code has no framework imports so it can move to a service later.

```
src/
  app/                      # Next.js routes and UI
    api/v1/...              # route handlers (thin: parse → call domain → format)
  contracts/                # zod schemas and TS types shared by UI and API
  domain/
    returns/                # money, xirr, tenure, classify, readings (deterministic)
    debit/                  # rules table loader, evaluate(), status
    pause/                  # state machine, scheduler, reminders
    explain/                # orchestrator, templates, intent guard, rephraser, validator
    sources/                # library, selection, attribution
    confidence/             # label rule
  data/
    provider.ts             # SipDataProvider interface
    mock/                   # MockProvider, fixtures (personas)
    db/                     # repositories (Prisma or Drizzle)
  content/                  # approved passages, term definitions, refusal text, banned phrases
  rules/                    # debit-rules.v1.json (versioned), bands.v1.json
  lib/                      # logging, errors, clock, config, rate limit
tests/                      # unit, golden, red-team, e2e
```

**Layering rule [REQ]:** `domain/*` may not import `explain/llm`. Only `explain/rephraser` may call the model, and it receives a prebuilt, validated fact object. This is enforced by a lint rule (import boundary) and a unit test.

**Request flow (Return Coach)**
1. Route handler validates input (zod) → `Orchestrator.coach(sipId, intent)`.
2. `SipDataProvider.getSip(sipId)` → instalments, valuation (mock).
3. `returns` computes figures and tenure; `classify` picks the situation; `confidence` computes the label.
4. `sources` selects approved passages and sources for that situation and tenure stage.
5. Intent guard (deterministic) accepts, refuses or falls back.
6. Template text is built (always). If the LLM is enabled, `rephraser` rewrites it; `validator` checks it; on any failure the template stands.
7. Response includes figures, explanation blocks, sources, confidence, disclaimer, `explanationId`.
8. The audit record is written (masked).

---

## 4. Data model

Money is stored as **integer paise** (no floating point). Dates are ISO dates in `Asia/Kolkata` for display, UTC in storage.

```
User            (id, display_name, persona_key, is_mock=true, created_at)
Sip             (id, user_id, scheme_name, frequency[DAILY|WEEKLY|MONTHLY|QUARTERLY],
                 amount_paise, start_date, status[ACTIVE|PAUSED|CANCELLED|COMPLETED],
                 mandate_type, mandate_status, tenure_months NULL, created_at)
Instalment      (id, sip_id, due_date, amount_paise, status[SUCCESS|FAILED|PENDING|SKIPPED],
                 settled_at NULL, units_allocated NULL, nav_paise NULL)
Valuation       (id, sip_id, as_of_date, current_value_paise, provider_xirr_bps NULL,
                 source[MOCK|PROVIDER])
DebitEvent      (id, sip_id, instalment_id, occurred_at, reason_code,
                 provider_message NULL, retry_status[NONE|SCHEDULED|EXHAUSTED],
                 next_retry_date NULL, manual_retry_allowed BOOL)
PauseRecord     (id, sip_id, requested_at, pause_start, pause_end NULL,
                 state[SCHEDULED|ACTIVE|ENDED|CANCELLED_BY_USER], resumed_at NULL)
ReminderPref    (id, pause_id, opted_in BOOL, remind_at NULL, channel[IN_APP|EMAIL|SMS|PUSH],
                 sent_at NULL, created_at)
Source          (id, publisher, title, url, published_date NULL, accessed_date,
                 review_status[DRAFT|VERIFIED|RETIRED], reviewed_by NULL, reviewed_on NULL)
Passage         (id, source_id, topic[XIRR|ABS_RETURN|NAV|VOLATILITY|EARLY_SIP|PAUSE|MANDATE|...],
                 tenure_stage NULL, situation NULL, text, version, review_status)
RuleSet         (id, name, version, effective_from, json, review_status, source_ids[])
ExplanationLog  (id, module, sip_hash, inputs_masked_json, rule_version, template_id,
                 passage_ids[], source_ids[], confidence, llm_used BOOL, llm_model NULL,
                 validator_result, refused BOOL, fallback BOOL, latency_ms, created_at)
Feedback        (id, explanation_id, clear BOOL NULL, felt_like_advice BOOL NULL, created_at)
EvalRun         (id, suite, commit, results_json, passed BOOL, created_at)
```

**Mock persona fixtures (illustrative; not research data)** exercise the key paths:

| Persona key | Shape | Exercises |
|---|---|---|
| `early-flat` | Monthly SIP, 5 instalments of ₹2,500 (₹12,500 invested), small negative | Coach, tenure stage 3–6 |
| `positive` | Same tenure, small positive | Coach, no pull, quiet default |
| `new-month-1` | One instalment | Insufficient-data fallback |
| `long-tenure` | 14 months | Over-12 stage |
| `debit-upi-limit` | Failed instalment, mapped reason | Debit Explainer |
| `debit-unknown` | Unmapped reason code | Generic fallback |
| `debit-mandate-expired` | Mandate not active | Debit Explainer, next action |
| `cashflow-pause` | Active SIP, user wants to pause | Pause and Restart |
| `quarterly` | Quarterly SIP | Frequency edge cases |
| `missing-xirr` | No provider XIRR | Recompute path |

Fixtures are plain JSON in `data/mock/fixtures/` and seeded to the database; the demo clock moves "today" without changing fixtures.

---

## 5. API structure

REST over JSON, versioned at `/api/v1`. All inputs validated with zod; all responses validated before returning. Every response carries `requestId`. Errors use the shape in §10.

| Method and path | Purpose | Module |
|---|---|---|
| `GET /api/v1/personas` | List demo personas | demo |
| `GET /api/v1/sips?userId=` | List SIPs with status | all |
| `GET /api/v1/sips/{id}` | SIP detail: figures, tenure, status | 1, 3 |
| `POST /api/v1/sips/{id}/coach` | Return Coach explanation | 1 |
| `GET /api/v1/terms/{key}` | Vetted term definition with source | 1 |
| `GET /api/v1/sips/{id}/debit-events` | Failed/missed instalments | 2 |
| `GET /api/v1/debit-events/{id}/explanation` | Debit Explainer output | 2 |
| `POST /api/v1/debit-events/{id}/retry` | Manual retry (mock; only if allowed) | 2 |
| `POST /api/v1/sips/{id}/pause` | Create a pause | 3 |
| `PATCH /api/v1/pauses/{id}` | Extend, resume or end | 3 |
| `GET /api/v1/sips/{id}/options` | Pause vs reduce vs cancel explanation | 3 |
| `PUT /api/v1/pauses/{id}/reminder` | Set or clear opt-in reminder | 3 |
| `POST /api/v1/feedback` | Clear / felt-like-advice | 1 |
| `GET /api/v1/sources` | Source library (verified only) | all |
| `POST /api/v1/demo/clock` | Set demo clock (flagged) | demo |
| `GET /api/v1/health` | Liveness and readiness | ops |

**Example: Return Coach request and response**

```json
POST /api/v1/sips/sip_001/coach
{ "intent": "EXPLAIN_RETURN" }          // R1: fixed intents only; free text is R2
```
```json
{
  "requestId": "req_01H…",
  "explanationId": "exp_01H…",
  "figures": {
    "investedPaise": 1250000, "currentValuePaise": 1225000,
    "absoluteReturnPaise": -25000, "absoluteReturnPct": -2.00,
    "xirrPct": null, "xirrSource": "RECOMPUTED",
    "instalmentsPaid": 5, "tenureMonths": 5, "stage": "M3_6",
    "asOfDate": "2026-11-08"
  },
  "situation": "SMALL_NEGATIVE",
  "blocks": [
    { "id": "figures", "title": "Your figures", "text": "…", "templateId": "T_FIG_1" },
    { "id": "means",   "title": "What this means at month 5", "text": "…", "templateId": "T_MEAN_SMALLNEG_M3_6" },
    { "id": "not",     "title": "What it does not mean", "text": "…", "templateId": "T_NOT_1" }
  ],
  "terms": ["XIRR", "ABS_RETURN"],
  "sources": [ { "id": "src_amfi_…", "publisher": "…", "title": "…", "url": "…", "date": "…" } ],
  "confidence": { "label": "HIGH", "reasons": ["FIGURES_COMPLETE","RULE_MATCHED","SOURCE_ATTACHED"] },
  "disclaimer": "Explains your SIP figures. Not investment advice.",
  "mode": "TEMPLATE",              // or "LLM_REPHRASED"
  "fallback": false
}
```
(The values above are mock-data illustrations. Text and source entries are placeholders until the content library is authored and verified.)

---

## 6. Return calculation logic (deterministic)

All in `domain/returns/`. Pure functions, no I/O, fully unit-tested.

### 6.1 Inputs
From the provider: SIP frequency; the list of **successful** instalments (date, amount); current value and valuation date; optional provider XIRR.

### 6.2 Formulas
- **Invested** `I = Σ amount of successful instalments` (paise, integer).
- **Current value** `V` = provider/mock valuation.
- **Absolute return** `A = V − I` (paise); `A% = A / I × 100` (rounded half-up to 2 dp for display; stored unrounded as a rational or at 4 dp).
- **Tenure** from the **first successful instalment date** `d₀` to the valuation date `dₙ`: `months = full calendar months`, `days = dₙ − d₀`. Stage: `M1` (<1 month), `M1_3`, `M3_6`, `M6_12`, `OVER_12` (boundaries inclusive on the lower end; defined in `bands.v1.json`).
- **XIRR**: solve for rate `r` such that `Σ cᵢ / (1 + r)^((dᵢ − d₀)/365) = 0`, where cash outflows `cᵢ = −amountᵢ` on instalment dates and the terminal inflow `+V` on the valuation date. Method: bracketed bisection with Newton refinement, tolerance 1e-9, max 200 iterations, using Decimal arithmetic. If there are fewer than 2 cash flows, all flows have the same sign, or the solver fails to converge, return `null` (never an estimate).
- **Provider XIRR reconciliation:** if the provider supplies XIRR, display it as "as shown in your account"; also recompute; if they differ by more than a configurable tolerance, set `xirrMismatch=true`, show the provider figure, lower confidence to MEDIUM, and log the discrepancy.
- **Early-tenure note [D]:** if tenure < 12 months, XIRR is an annualised rate extrapolated from a short period and can look extreme; the term sheet states this (RC-5). The engine sets `xirrAnnualisedShortPeriod=true`.
- **Instalments paid / missed:** counts from instalment statuses; failed instalments are excluded from `I`.

### 6.3 Situation classification (rules, configurable)
`bands.v1.json` defines, with a source and review status for each threshold:
- `flatBandPct` (e.g., |A%| ≤ a configured tolerance → `FLAT`) [A: value to be set and reviewed; not a research finding];
- `SMALL_NEGATIVE`, `NEGATIVE`, `SMALL_POSITIVE`, `POSITIVE` cut-offs;
- stage boundaries.

The classifier returns `situation` (`FLAT | SMALL_NEGATIVE | NEGATIVE | SMALL_POSITIVE | POSITIVE | INSUFFICIENT_DATA`) using only `A%`, tenure and instalment count. `INSUFFICIENT_DATA` triggers the fallback (e.g., one instalment, or missing valuation).

### 6.4 Confidence label (deterministic)
| Label | Rule |
|---|---|
| **HIGH** | `I`, `V`, valuation date, tenure all present; situation matched a rule; no XIRR mismatch (or XIRR not required for this block); ≥1 verified source attached; validator passed or template path used |
| **MEDIUM** | Partial data (e.g., XIRR missing but not needed), XIRR mismatch, or general education only |
| **LOW** | Insufficient data, no verified source, out-of-scope, or validator failure → fallback |

### 6.5 Number formatting
One module formats all figures (₹ with Indian digit grouping, sign, 2 dp, tabular figures). The same formatter is used to substitute placeholders (§7), so displayed text and structured figures cannot differ.

---

## 7. LLM integration (optional, bounded)

### 7.1 What the model may and may not do
| May | May not |
|---|---|
| Rephrase approved template/passage text for readability | Calculate, round, convert, estimate or infer any figure |
| Reorder sentences within a block | Introduce a number, date, percentage, fee, limit or deadline |
| Adjust reading level and tone | Add claims, comparisons, predictions or advice |
| | Choose sources or the confidence label |
| | Decide whether to refuse |

### 7.2 Pipeline
1. **Build the fact object** (code): named figures, situation, stage, approved passage IDs and their text, banned-phrase list.
2. **Placeholder contract:** the template text uses tokens such as `{{invested}}`, `{{current_value}}`, `{{abs_return_pct}}`, `{{tenure_months}}`. The model is instructed to keep every token verbatim and to **write no digits at all**.
3. **Call** (server-side only): system prompt carries rules; user message carries the template blocks and allowed passage text; no tools, no web access, no user free text in R1; low temperature; max-tokens cap; timeout (see §10); structured JSON output `{blocks:[{id,text}]}`.
4. **Validate** (code, all must pass):
   - JSON schema valid; same block IDs.
   - **No digit characters** outside placeholders; every required placeholder present exactly as many times as in the template; no unknown placeholders.
   - **Substitute** placeholders with the formatter's values → final text.
   - **Banned-phrase and pressure-language scan** (the same linter used in CI) passes.
   - **Advice-pattern scan** passes (no imperative to continue, stop, buy, sell, switch).
   - **No new named entities** (funds, AMCs, brands) beyond the allowed list.
   - **Length bound** relative to the template.
   - Optional **semantic check** against the template (second small model or embedding similarity) is a P2 enhancement.
5. **On any failure:** discard the model output, serve the template, set `mode="TEMPLATE"`, `fallback=false` (this is a normal path), and log `validator_result`.
6. **Never** pass personal data: only the fact object (rounded figures are placeholders, so the model doesn't even see them; it sees tokens). Names, contact details, account numbers and PAN are never present in the mock or in prompts.

### 7.3 Intent guard (deterministic first)
- R1 accepts **fixed intents only**: `EXPLAIN_RETURN`, `EXPLAIN_TERM(key)`, `WHAT_IS_NORMAL`.
- R2 free text passes through a deterministic pre-filter (regex and keyword patterns for advice requests: should I stop/continue/sell/buy/switch, which fund, will it recover, is this a good time, what would you do, and common Hinglish variants once tested). A match returns the **fixed refusal template without calling any model**. Unmatched text goes to an optional classifier model that can only return one label from a closed set (`IN_SCOPE`, `ADVICE`, `OFF_TOPIC`, `UNSURE`); `ADVICE` and `UNSURE` produce the refusal or fallback.
- The advice refusal and the not-sure fallback are **static templates**, never model-written.

### 7.4 Provider and configuration
- Provider-agnostic `LlmClient` interface; implementation chosen by environment (`LLM_PROVIDER`, `LLM_MODEL`; no model IDs in code). `LLM_ENABLED=false` runs the whole product on templates.
- A prompt version ID is logged with every call. Prompts live in `content/prompts/` under version control.
- Costs and latency are logged per call.

### 7.5 Eval gate (links to `evaluation-framework.md`)
Before `LLM_ENABLED` can be true in production: ≥95% correct on rule questions, 100% refusal on advice prompts, 0 invented numbers/fees (enforced structurally by the no-digit rule and tested with red-team prompts), correct fallbacks, on the new ~40-scenario golden set. Targets are proposed, not yet measured.

---

## 8. Rules-based debit engine (no LLM)

### 8.1 Components
`domain/debit/` loads a **versioned rules file** (`rules/debit-rules.v1.json`, mirrored in `RuleSet`), and exposes `evaluate(event, sip, today) → DebitExplanation`.

### 8.2 Rule row schema
```
{
  "reasonCode": "UPI_LIMIT_EXCEEDED",
  "category": "USER_ACTION | BANK_SIDE | TEMPORARY | MANDATE | UNKNOWN",
  "plainReason": "template id",
  "sipStatusOutcome": "MISSED_CONTINUES | AT_RISK | CANCELLED | UNKNOWN",
  "primaryAction": { "type": "ADD_BALANCE_RETRY | REVIEW_LIMIT | RENEW_MANDATE | CONTACT_SUPPORT | WAIT_FOR_RETRY",
                     "label": "template id", "deepLink": "optional" },
  "secondaryAction": "optional",
  "retryNote": "AUTO_RETRY | MANUAL_ONLY | NONE",
  "consequenceNotes": [ { "text": "template id", "verifiedBy": "source id" } ],
  "sourceIds": ["…"], "reviewStatus": "DRAFT | VERIFIED"
}
```
- **Reason codes in the prototype are illustrative categories** (insufficient balance, UPI limit exceeded, mandate expired or inactive, bank declined, technical error, unknown). They are **not** real provider codes; the real code list is a dependency (PRD §12) and replaces them through the provider adapter without engine changes.
- `consequenceNotes` (bank charges, consecutive-failure cancellation) are included **only** if `verifiedBy` references a verified source. A rule row without it states nothing about fees or cancellation (DE-6). The consecutive-failure threshold is a config value that is `null` until verified; with `null`, no "at risk" status is produced.

### 8.3 Evaluation algorithm
1. Look up the rule by `reasonCode`; unknown → the `UNKNOWN` row (generic message, contact-support action).
2. Determine **SIP status** from the SIP record and rule outcome via a small state table: `ACTIVE`, `MISSED_CONTINUES` (this instalment missed, SIP continues), `AT_RISK` (only if the verified threshold is configured and reached), `CANCELLED`, `PAUSED`.
3. Determine **retry info**: from `retry_status`/`next_retry_date` supplied by the provider; show a manual retry button only if `manual_retry_allowed`; otherwise show nothing.
4. Pick **one primary action** and at most one secondary from the rule; check the action is feasible (e.g., renew-mandate only if `mandate_status != ACTIVE`).
5. Assemble the output from **templates** (no model). Output is a pure function of `(event, sip, today, ruleVersion)`.
6. Log rule version, reason code, template IDs.

### 8.4 Output (example shape)
```json
{ "reason": {"category":"USER_ACTION","text":"…"},
  "sipStatus": {"state":"MISSED_CONTINUES","text":"…"},
  "nextAction": {"type":"ADD_BALANCE_RETRY","label":"…","deepLink":null},
  "retry": {"auto": true, "nextRetryDate": "2026-11-12", "manualAllowed": false},
  "consequences": [],
  "sources": [], "ruleVersion": "v1", "explanationId": "exp_…" }
```

### 8.5 Tests
One unit test per rule row, plus unknown code, missing retry data, mandate states, and a **determinism test** (same input → byte-identical output, repeated 100×). A test fails the build if the module imports any LLM code.

---

## 9. Pause and restart logic

### 9.1 State machine (SIP-level)
```
            pause(start,end?)                       resume / end date reached
ACTIVE ────────────────────────▶ PAUSE_SCHEDULED ───────────────┐
  ▲                                   │ start date reached       │
  │                                   ▼                          │
  │                               PAUSED ───────────────────────┼──▶ ACTIVE
  │       undo (before start)         │ extend(end')             │
  └───────────────────────────────────┘◀─────────────────────────┘
ACTIVE|PAUSED ── cancel ──▶ CANCELLED  (terminal; always user-initiated)
```
- `end` may be null ("until I resume"). A paused SIP never auto-resumes **unless the user chose an end date**; at that date the SIP returns to ACTIVE per the user's own choice (and the user is told this at confirmation).
- Debits scheduled inside the pause window are marked `SKIPPED` (not `FAILED`).
- Transitions are validated server-side; illegal transitions return `409` with a plain message.
- Every transition writes an immutable audit event.

### 9.2 Options explainer (PR-1)
`GET /sips/{id}/options` returns the Pause / Reduce / Cancel comparison from approved content. Statements about mandates and charges are included only if verified (rule rows with sources); none is preselected or ranked.

### 9.3 Reminders (PR-5, PR-6, PR-9)
- Default **off**. `PUT /pauses/{id}/reminder` with `opted_in=false` creates nothing.
- If opted in: exactly **one** reminder per pause, at the user-chosen date and time and channel. No escalation, no repeats, no second message if ignored.
- Reminder text is a static template: factual status plus three equal actions (Resume, Extend, Leave paused). Linted for pressure language.
- **Prototype delivery:** reminders appear in an **in-app inbox** and in the Demo panel; the demo clock fires them. Email, SMS or push require a real notification service (dependency) and are behind an adapter interface (`NotificationChannel`) with a mock implementation.
- Scheduler: a cron or queue job (Vercel Cron in the deployed prototype) selects due, opted-in, unsent reminders; the job is idempotent (`sent_at` guard).
- Undo: a pause can be cancelled before it starts or reversed immediately after, where the mock supports it.

### 9.4 Mandate handling
The prototype models `mandate_status` (`ACTIVE | INACTIVE | EXPIRED`) and shows implications only from verified rule rows; if the real platform cannot pause a mandate, the adapter reports `capabilities.pauseMandate=false` and the UI states what will happen instead (PR-10).

---

## 10. Source attribution

- **Library:** `Source` and `Passage` tables (§4). Each source has publisher, title, URL, published date, **accessed date**, review status, reviewer. Only `VERIFIED` entries can be attached to a user-facing answer.
- **Seeding rule [REQ]:** sources are added only from documents actually retrieved and read (e.g., AMFI, SEBI, an AMC factsheet, an INDmoney help page). **No source entry is fabricated or paraphrased from memory.** Entries marked `DRAFT` never display.
- **Selection:** deterministic by `topic`, `situation` and `tenure_stage`; at least one verified source per explanation block that makes a general statement; figures-only blocks cite "your account data (mock)" in the prototype.
- **Attribution in the response:** every block lists `passageIds` and `sourceIds`; the response `sources[]` is the deduplicated union with title, publisher, URL and dates.
- **Prototype label:** because data is mock, every screen carries a "Demo data" chip; sources are real, figures are not.
- **Staleness:** a nightly or CI check flags sources older than a configured age for review; retired sources are removed from selection and logged.
- **Enforcement:** an answer with a general statement and no verified source cannot be served; the orchestrator returns the Not-sure fallback instead (RC-7, RC-10).

---

## 11. Error handling

**Error envelope**
```json
{ "requestId":"req_…", "error": { "code":"PROVIDER_UNAVAILABLE", "message":"plain text for users",
  "retryable": true, "fallbackShown": true } }
```

| Failure | Detection | Behaviour |
|---|---|---|
| Invalid input | zod | `400 INVALID_INPUT`, field messages, nothing logged with the raw value |
| SIP not found / not owned | repository | `404` |
| Provider (mock/DB) unavailable | timeout / exception | `503`; UI shows the standard SIP view and the Not-sure card |
| Missing valuation or instalments | domain check | `situation=INSUFFICIENT_DATA` → deterministic fallback; confidence LOW |
| XIRR fails to converge or invalid | solver | `xirr=null`, "XIRR unavailable" note; Coach still works on absolute return |
| XIRR mismatch with provider | reconciliation | show provider figure, MEDIUM, log |
| LLM disabled / timeout / 5xx / rate limit | client | immediate **template path**; no user-visible error; retry once with jitter only if the budget allows |
| LLM output fails validation | validator | discard, template path, `validator_result` logged |
| Advice request | intent guard | fixed refusal; not an error |
| Unknown debit reason code | rules lookup | `UNKNOWN` row; support action |
| Illegal pause transition | state machine | `409`, plain text, no state change |
| Reminder channel failure | adapter | retry with backoff; after N failures mark `FAILED`, never send duplicates; show in-app |
| Rule or content file invalid at boot | schema check | **fail the build/deploy**, not at runtime |
| Unhandled exception | global handler | `500` with `requestId`, generic message; stack trace logged server-side only |

**Principles:** user messages are plain and calm (no alarm colour for system errors); errors never expose internals; every error has a `requestId`; the UI never shows a half-rendered explanation.
**Resilience:** timeouts on every outbound call (LLM ≤ 4 s budget, DB ≤ 2 s); idempotency keys on mutating endpoints (pause, retry, reminder); optimistic UI only for non-financial toggles.

---

## 12. Security and privacy

**Data posture:** the prototype contains **mock data only**; no real customer data, names, contact details, account numbers or PAN exist in the system, the prompts, the logs or the repository. Research data stays in `research/` and is not used by the product.

| Area | Control |
|---|---|
| Secrets | API keys only in environment variables (server-side); `.env` git-ignored; `.env.example` has no values; separate keys per environment; rotate on exposure. |
| LLM calls | Server-side only; never from the browser; no personal data; tokens-only fact objects (§7); provider zero-retention / no-training setting required [A]; prompt and response sizes capped. |
| Input handling | zod validation on every route; fixed intents in R1; free text (R2) length-capped and PII-masked before storage; output encoding to prevent XSS; no HTML from the model is ever rendered (text only). |
| Prompt injection | No tools, no web, no user-controlled text in R1; in R2 the deterministic pre-filter and closed-set classifier run first; output validator rejects digits, banned phrases and unknown entities. |
| Transport and headers | HTTPS only; HSTS; CSP (default-src 'self', explicit allow-list for fonts); `X-Content-Type-Options`; `Referrer-Policy`; secure, httpOnly, sameSite cookies if sessions are used. |
| AuthN/Z (prototype) | Demo personas selected without login; every request scoped by a signed `demoSession` so one session cannot read another's state; the production path uses INDmoney's own session through the provider adapter. |
| Rate limiting | Per IP and per session (route handler middleware / edge); stricter on any LLM-backed route. |
| Logging | Structured logs with `requestId`; masked inputs; no raw prompts containing figures; ExplanationLog stores rule/template/passage/source IDs, confidence, mode, latency; retention short and documented; access restricted. |
| Consent and control | User can turn off the Coach and reminders; reminder opt-in default off. |
| Financial safety | Linter and validator enforce no advice, no pressure language, no predictions; fixed refusal; "Not investment advice" on every Coach surface; compliance review of all copy before any pilot. |
| Supply chain | Lockfile, dependency audit in CI, minimal dependencies (the engine already uses very few), pinned versions. |
| Compliance | Indian data-protection and SEBI requirements to be reviewed by legal before any real-data pilot [A]. |
| Production data path | Provider adapter minimises fields (only those listed in the PRD), transmits over service-to-service auth, and never persists raw account identifiers (store a salted hash `sip_hash`). |

---

## 13. Deployment architecture

| Layer | Prototype (R1) | Notes |
|---|---|---|
| Hosting | **Vercel** (same as the AI engine) | Production, preview per pull request |
| App | Next.js 16 Route Handlers and RSC | Region close to users (e.g., Mumbai if available) [A] |
| Database | Managed Postgres (e.g., Vercel Postgres / Neon); SQLite file for local development | Prisma or Drizzle migrations in CI; seeded fixtures |
| Scheduler | Vercel Cron → `/api/internal/reminders/run` (secret-protected, idempotent) | Demo clock can trigger it manually |
| LLM | External API, optional (`LLM_ENABLED`) | Provider and model from env |
| Config | Environment variables plus versioned `rules/` and `content/` files | Validated at build |
| Feature flags | `LLM_ENABLED`, `DEMO_PANEL`, `MODULE_PAUSE_ENABLED`, `FREE_TEXT_ENABLED` | Env-driven; default off for the last |
| Observability | Vercel logs and a lightweight error tracker; custom counters for fallback rate, refusals, validator rejections, latency | Dashboards for the eval metrics |
| CI/CD | GitHub Actions: lint (including import-boundary and pressure-language linters), type-check, unit and determinism tests, red-team and golden-set evals, build, deploy | A failing eval gate blocks deploy |
| Environments | `local`, `preview`, `production` (demo); distinct keys and databases | No real data in any |

**Path to real data (no core changes):** implement `IndmoneyProvider` against whatever INDmoney exposes; map its payment and mandate reason codes into the rules file; run the provider's capability check (`pauseWithDate`, `manualRetry`, `pauseMandate`); keep the `MockProvider` for tests and demos. The domain code, contracts and UI are unchanged.

**Interface sketch**
```ts
interface SipDataProvider {
  listSips(userId: string): Promise<Sip[]>;
  getSip(sipId: string): Promise<Sip>;
  getInstalments(sipId: string): Promise<Instalment[]>;
  getValuation(sipId: string, asOf: Date): Promise<Valuation | null>;
  getDebitEvents(sipId: string): Promise<DebitEvent[]>;
  pause(sipId: string, req: PauseRequest): Promise<PauseResult>;       // may be unsupported
  resume(sipId: string): Promise<PauseResult>;
  capabilities(): { pauseWithDate: boolean; manualRetry: boolean; pauseMandate: boolean };
}
```

---

## 14. Testing strategy (maps to `tests/`)

| Suite | Content |
|---|---|
| Unit: returns | Money in paise, absolute return, tenure stages, XIRR against known cash-flow cases and edge cases (single flow, same-sign flows, extreme rates), classifier bands, confidence rule |
| Unit: debit | One test per rule row, unknown code, retry flags, determinism, "no LLM import" guard |
| Unit: pause | Every legal and illegal transition, skipped debits, single reminder, idempotent scheduler |
| Contract | zod schemas and API responses |
| LLM validator | Digits rejected, placeholders preserved, banned phrases, advice patterns, unknown entities, length bound, template fallback |
| Golden set | The ~40 hand-labelled scenarios (not yet built) |
| Red-team | Indirect advice prompts, injection, prediction extraction (R2 free text) |
| Content lint | Banned phrases and pressure language across `content/` and UI strings |
| E2E | Playwright: each persona, both themes, three viewports, keyboard path |
| Accessibility | Automated checks plus manual screen-reader pass |

---

## 15. Build order (prototype)

1. Domain: money, returns, tenure, classify, confidence (+ tests).
2. Mock provider, fixtures, DB schema.
3. Content library skeleton and template renderer; Coach endpoint on templates only; UI for `/sip/[id]` and `/coach` in both themes.
4. Debit rules engine and Explainer UI.
5. Pause state machine, options, reminder (in-app), demo clock.
6. LLM rephraser behind the flag, validator, red-team tests; enable only after the eval gate.
7. Observability, security headers, rate limits, deploy.

## 16. Open items
1. Confirm hosting (Vercel) and the database choice.
2. Choose the LLM provider and confirm zero-retention terms; decide whether R1 ships with the LLM at all.
3. Author and verify the source and passage library (real documents only).
4. Set and review the flat/negative band thresholds.
5. Obtain real provider reason codes and platform capabilities (for post-prototype integration).
6. Name the content owner and compliance reviewer.


---

## 17. Stack and migration decisions (owner decision D-02, 2026-11-08)

**Why.** `next@14.2.35` (the last 14.x release) still carried a critical production advisory chain whose fixes exist only in Next 16.x, plus high advisories in the bundled PostCSS and in Zod 3. The owner approved upgrading while the application was still a placeholder. Security advisories are fixed, not suppressed.

### 17.1 Resulting stack

| Layer | Before | Now |
|---|---|---|
| Framework | Next.js 14.2.24 (then 14.2.35) | **Next.js 16.4.5** (App Router, Turbopack default for dev and build) |
| UI runtime | React 18.3 | **React 19.3** (`react`, `react-dom`) |
| Language | TypeScript 5.4 | TypeScript 5.9 (Next 16 needs 5.1 or newer; TypeScript 7 was **not** adopted) |
| Validation | Zod 3 | **Zod 4.6.7** (fixes the oversized-collection memory advisory) |
| Linting | ESLint 8, `.eslintrc.json`, `next lint` | **ESLint 9.39**, flat config `eslint.config.mjs`, `eslint-config-next` 16.4.5, `npm run lint` = `eslint .` |
| Tests | Vitest 2 | **Vitest 5.1** with Vite 7.3 (peer requirement); `@types/node` 24 |
| CSS | Tailwind 3.4, PostCSS 8.5.32 | unchanged (Tailwind 4 not adopted; no benefit for the prototype) |
| Node | 20 | **22.12 or newer** (Vitest 5 requirement); CI uses Node 22 |

### 17.2 Migration notes that affect later phases
1. **Async request APIs.** In Next 16, `params`, `searchParams`, `cookies()` and `headers()` are Promises. Every dynamic route handler added in Phases 1 to 5 (for example `/api/v1/sips/[id]/coach`) must declare `{ params }: { params: Promise<{ id: string }> }` and `await` it. `withApi` will gain a typed helper for this.
2. **`middleware` is now `proxy`.** Rate limiting and extra headers planned for Phase 8 go in `src/proxy.ts`, not `middleware.ts`.
3. **No `next lint`.** Lint runs ESLint directly; `next build` no longer lints. CI therefore runs `lint` as its own step (already the case).
4. **Flat ESLint config.** The architecture boundary rule (deterministic code must not import LLM code) is expressed in `eslint.config.mjs`; the unit test that proves it still fails correctly was kept and passes.
5. **React 19 lint rules** forbid synchronous `setState` inside effects. The theme toggle now uses `useSyncExternalStore`; the health check fetches in the effect and sets state only from the async callback. Future components follow the same pattern.
6. **`tsconfig.json`** was adjusted by Next on first build (`jsx: react-jsx`, extra `.next/dev/types` include). Both are accepted.
7. **Features deliberately not used** (they carried advisories in earlier versions and the prototype does not need them): `next/image` optimisation, rewrites, Server Actions, i18n routing, custom servers. If any is introduced later, re-run the audit and review the relevant advisories.

### 17.3 Compatibility verification (2026-11-08)
Typecheck, lint, 38 unit tests, production build, development server (no console or hydration warnings), and 26 live checks all pass on the new stack (see `docs/implementation-log.md`).

### 17.4 Audit results
- `npm audit --omit=dev`: **0 vulnerabilities** (was 1 critical, 2 high).
- `npm audit` (including dev tooling): **8 moderate, 0 high, 0 critical** (was 11 moderate, 1 high, 2 critical). The 8 remaining findings are all in the ESLint toolchain (`eslint-config-next` to `typescript-eslint` to `minimatch`, a denial-of-service pattern on crafted globs). They affect developer tooling only, not the shipped application. npm's only suggested "fix" is a downgrade to an older Next config, which would reintroduce unsupported behaviour, so it was **not** applied; the findings are recorded openly in `docs/decisions.md` and will be re-checked at each phase gate and before deployment.

### 17.5 LLM constraint restated (owner decision D-10, strict)
The model must **never receive, calculate, modify, generate or independently interpret financial figures**. It rephrases approved template text that contains placeholders, and only in these prose fields of the Return Coach response; every other field is populated and validated by deterministic code.

| Response field | Produced by | Model may rephrase? |
|---|---|---|
| `summary`, `explanation`, `tenure_context`, `metric_explanation`, `limitations` | Approved templates with placeholders (rendered by code) | **Yes, only when `LLM_ENABLED=true`, and only through the placeholder contract** |
| `figures` (invested, value, returns, XIRR, tenure, stage) | Deterministic returns engine | No |
| `sources` | Deterministic selection from the verified library | No |
| `confidence` (label and reasons) | Deterministic rule | No |
| `refusal_status` | Deterministic intent guard; refusal text is a static template | No |
| `follow_up_suggestions` | Fixed list | No |

**Rejection rule.** If the model's output changes, removes or introduces a financial figure (any digit outside a placeholder, a missing or altered placeholder, an unknown placeholder), or adds an unsupported claim (new named entity, banned phrase, advice pattern), the whole response is discarded and the template text is served. The model sees placeholder tokens, not the numbers behind them, so it has nothing to alter in the first place; the validator is the second line of defence. The validator must also reject **spelled-out numbers** (for example "twenty-five thousand", "two lakh", "half", "double", "ten per cent"), because a digit-only check would miss them; each such case is in the seeded validator suite in `evaluation-framework.md` §7. This is an architectural constraint, not a preference (see §7).
