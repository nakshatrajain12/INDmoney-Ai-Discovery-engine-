# Product Requirements Document: INDmoney SIP Confidence and Recovery Experience (SIP Steady)

**Status:** Draft v1 · **Date:** 2026-11-08 · **Inputs:** `problem-statement.md`, `research-context.md` (the evidence base; survey N=26, interviews P01–P05, P00 contextual only).

**Labels:** **[F]** fact from research · **[H]** hypothesis · **[A]** assumption to confirm · **[REQ]** requirement. Priorities: **P0** must ship in the MVP · **P1** next · **P2** later.

---

## 1. Summary

**Problem.** Investors can see what happened to their SIP but not what it means or what to do next. [F] 13/26 surveyed SIP investors were unsure about returns or confused by terms; 16/26 rated their confidence in SIP metrics 1–3; 11/26 reported a payment or mandate issue; P02 paused and did not restart.

**Product.** Three modules inside the SIP journey, in priority order:

| # | Module | Mechanism | Priority |
|---|---|---|---|
| 1 | **Return Coach** | Explains the user's own flat or negative figure at their SIP stage, in plain language, with sources and a confidence label. Refuses advice. | **P0, built first** |
| 2 | **Debit Explainer** | Explains a failed debit with reason, SIP status and next action from deterministic rules. No LLM. | P0 (parallel, non-AI) |
| 3 | **Pause and Restart** | User-chosen pause date, clear status, opt-in restart reminder. Never pressures. | P1 |

**Evidence status [H].** The research supports the *problem* [F]. Nothing here has been shown to raise retention. Every claim of effect below is a hypothesis to test.

**Non-negotiables [F, from the brief].** No fund or stock recommendations. No fear, FOMO or urgency. Nothing presented as investment advice.

## 2. Goals and non-goals

**Goals**
- G1. Help a first-year investor understand what a flat or red return means at their stage, without advice.
- G2. Make every failed debit explain itself (reason, SIP status, next step).
- G3. Make pausing understandable and reversible, with restart only if the user asks.
- G4. Measure impact credibly, with holdouts and guardrails.

**Non-goals**
- Predicting returns, recommending funds, telling anyone to continue, stop, buy or switch.
- Replacing support, onboarding or portfolio analytics.

## 3. Target users

- **Primary [F]:** Uncertain Newcomers: first-time investors in the first 12 months unsure about returns or confused by terms (9/26 in the survey; 4 INDmoney, 5 Groww; 8/9 confidence 1–3; 7/9 expected quick returns).
- **Secondary [F]:** investors with a payment or mandate issue (11/26); cash-flow-constrained investors (4/26 gave a cash-flow reason; P02).
- **Guardrail population [F]:** confident continuers (9/26 never considered a change; 12/26 continue as usual when returns are flat or red; P04). They must not be pestered.

**Jobs to be done [H]**
1. When my return turns flat or red, I want to know whether that is normal at my stage.
2. When a debit fails, I want the reason, whether my SIP is still active, and one next step.
3. When my income changes, I want to pause or reduce without losing the plan, and be reminded only if I choose.

## 4. Scope and release plan

| Release | Contents | Gate |
|---|---|---|
| **MVP (R1)** | Module 1 core (P0 reqs), Module 2 core (P0 reqs, rules-based), advice-refusal and fallback, logging, disclaimer | Eval gate (§10), compliance read, ≥3 target-user tests |
| **R2** | Module 3; Module 1 free-text questions; Module 2 retry deep-link | R1 results; platform capability confirmed |
| **R3** | Additional languages; broader cohorts | R2 results |

---

## 5. MODULE 1: RETURN COACH (P0)

**Purpose.** At the moment of doubt, show what the user's own numbers mean at their SIP stage: descriptive, cited, never advice.

**Trigger points [H]**
- User opens a SIP or fund screen where the return is flat or negative.
- User taps "What does this mean?" / "Is this normal?" (always available, never pushed).
- *Not* a push notification in R1.

### 5.1 Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| RC-1 | **Use the user's actual figures.** Read for the selected SIP: invested amount, current value, absolute return (₹ and %), XIRR as shown in the app, SIP start date, number of instalments paid. If a figure is unavailable, say so and do not estimate. | P0 |
| RC-2 | **Compute tenure** from the first instalment date: months since the first instalment, instalments paid, and a stage label (month 1, months 1–3, 3–6, 6–12, over 12). Computed by deterministic code, not by the model. | P0 |
| RC-3 | **Classify the situation** by rules: positive, flat (within a defined tolerance band), negative; tenure stage; amount invested. Tolerance and bands are configuration, not model output. | P0 |
| RC-4 | **Plain-language reading** of the situation: what the figures show, and what that can and cannot tell the user at this tenure. Example structure: *what you see → what it means → what it does not mean.* | P0 |
| RC-5 | **Explain terms** the user's screen shows: XIRR, absolute return, invested vs current value, NAV, volatility, unrealised vs realised. Each term has one short vetted definition; XIRR definition states it is a money-weighted annualised rate that accounts for the timing of cash flows, and that it can look extreme early in a SIP. | P0 |
| RC-6 | **Contextual educational content** about early SIP behaviour (e.g., SIP returns early on are often near invested amount, short-term movements are normal, a SIP buys over time). Statements must be descriptive, drawn from vetted sources, and never predict this user's outcome. | P0 |
| RC-7 | **Sources.** Each explanation shows its sources (e.g., AMFI, SEBI, AMC factsheet, INDmoney help article) with title and date. No answer without at least one source, or it uses the fallback. | P0 |
| RC-8 | **Confidence label** on every answer: *High* (figures complete and a rule-based answer), *Medium* (partial data or general education only), *Low* (fallback). The label rule is deterministic and documented (§10.3). | P0 |
| RC-9 | **Refuse investment advice.** Requests such as "should I stop/continue/sell/buy/switch", "which fund", "will it recover", "is my fund bad" get a fixed refusal: what this tool can and cannot do, plus a pointer to an official source or a SEBI-registered adviser. No partial answer to the advice question. | P0 |
| RC-10 | **Safe fallback.** If inputs are missing, the question is out of scope, sources do not cover it, or confidence is low: say "I'm not sure", show an official source link, and offer help or support. | P0 |
| RC-11 | **Disclaimer** on every Return Coach surface: "Explains your SIP figures. Not investment advice." | P0 |
| RC-12 | **No pressure language.** No urgency, loss framing, countdowns, social proof, scarcity or FOMO. A copy linter blocks banned patterns. | P0 |
| RC-13 | **Quiet by default.** No push, banner or badge pulling users into the Coach in R1; confident continuers are not nudged. | P0 |
| RC-14 | **Feedback.** "Was this clear?" (yes / no) plus an optional "Did this feel like advice?" (yes / no). | P1 |
| RC-15 | **Free-text questions** about the user's SIP figures, within scope, same refusal and fallback rules. Hinglish is a hypothesis to test, not a commitment. | P1 (R2) |
| RC-16 | **Peer-range context.** Any "typical at this stage" statement is shown only if a vetted, dated source supports it; stated as a description of past patterns, never a forecast. If none is available, omit it. | P1, needs compliance sign-off |
| RC-17 | **Show the working.** A "How we worked this out" panel lists the figures used and the rule applied. | P1 |

### 5.2 Division of labour (design rule)
- **Rules and code own facts and numbers:** figures, tenure, band classification, terms, source selection, confidence label, refusal detection triggers.
- **A language model may only rephrase vetted content** for readability, from a structured input (figures + rule outputs + approved passages), with output validated against the input (no new numbers, no new claims). If the model is unavailable or validation fails, show the deterministic template text. [A] An LLM is used only after it passes the eval gate; the MVP must work with templates alone.

### 5.3 User stories and acceptance criteria

**RC-US1: Understand a flat or red figure**
*As a first-year investor, when my SIP return is flat or negative, I want a plain explanation of what it means at my stage, so I can decide for myself without second-guessing.*
- **Given** a SIP with 5 months of instalments and a −2% return, **when** I open the Coach, **then** I see my invested amount, current value, return, XIRR and tenure exactly as in my account.
- **Then** the explanation names my tenure (5 months), says what a small negative early on can and cannot indicate, and avoids predictions or advice.
- **Then** at least one dated source and a confidence label are visible.
- **Then** the disclaimer is visible without scrolling.

**RC-US2: Understand a term**
*As an investor, I want XIRR explained, so I understand the percentage I am shown.*
- **Given** I tap "XIRR", **then** I see the vetted definition, why it can look large or small early in a SIP, and a source. **And** the definition is identical every time (deterministic).

**RC-US3: Be refused advice, clearly**
*As the company, we need advice requests refused, so we never give investment advice.*
- **Given** I ask "Should I stop my SIP?" or "Which fund should I buy?", **then** I get the fixed refusal, no recommendation, no leaning either way, and a pointer to an official source or adviser.
- **Given** a prompt designed to elicit advice indirectly ("what would you do?", "is it a good time to continue?"), **then** the refusal still applies. Target: 100% on the advice-prompt test set.

**RC-US4: Honest uncertainty**
*As an investor, I want to be told when the tool does not know.*
- **Given** missing XIRR, an unsupported product, or an out-of-scope question, **then** the Coach says it is not sure, shows an official link, and does not guess.

**RC-US5: Stay quiet if I am fine**
*As a confident continuer, I do not want prompts to keep my SIP going.*
- **Given** a positive return or no interaction, **then** nothing is pushed. The Coach appears only on request or on a flat/negative figure screen entry point.

**RC-US6: No invented content**
- **Given** any answer, **then** every number shown exists in the input or the vetted source. A validator rejects an answer containing a number or claim not in either.

### 5.4 Content requirements
- Reading level: plain English, short sentences; support for Hindi/Hinglish deferred (P2).
- Required content blocks: *Your figures · What this means at month N · What it does not mean · Terms · Sources · Confidence · Disclaimer.*
- Banned: "buy", "sell", "switch", "stay invested" as an instruction, "don't panic", "you should", "guaranteed", "will recover", "act now", urgency or loss-aversion framing.
- Content owner and legal reviewer named before launch.

---

## 6. MODULE 2: DEBIT EXPLAINER (P0, deterministic)

**Purpose.** A failed debit says why it failed, whether the SIP is still active, and what to do. [F] 11/26 reported an issue; 4 of those 11 rated clarity 1–2; P03 saw only "failed". [H] Clear reason, status and action raise recovery.

**No LLM.** All output comes from a rules table and templates. This is a hard requirement.

### 6.1 Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| DE-1 | **Failure event input:** instalment date, amount, payment method, mandate type, failure reason code from the payment or mandate provider, retry status, SIP status. | P0 |
| DE-2 | **Reason mapping.** A versioned rules table maps each provider reason code to: plain-language reason, whether it is the user's action, the bank's, or temporary, and a recommended next step. Unknown codes map to a generic safe message with a "contact support" action. | P0 |
| DE-3 | **SIP status.** Always show whether the SIP is *still active*, *this instalment missed, SIP continues*, *at risk*, or *cancelled*, with the rule that produced it. | P0 |
| DE-4 | **Next action.** One primary action (e.g., add balance and retry, review UPI limit, renew mandate, contact support) and at most one secondary. | P0 |
| DE-5 | **Retry information when available.** Show the next automatic retry date if the provider retries; show a manual retry option only if the platform supports it; otherwise do not show it. | P0 |
| DE-6 | **Consequence rules.** State any consecutive-failure cancellation rule, and any bank charge, only if the rule is in the rules table with a source. [A] The deck states that banks may charge a bounce fee, AMCs do not charge a penalty, and three consecutive failures can lead to cancellation. **This has not been verified in this project** and must be confirmed against AMC, bank and RBI e-mandate rules before use. Never state a fee amount. | P0 |
| DE-7 | **Plain notification text.** Failure push/SMS/in-app notice uses the same template (reason, status, next step). No urgency or blame wording. | P0 |
| DE-8 | **Pre-debit visibility (user-set).** Show next debit date and amount in the SIP view; an optional, opt-in day-before reminder. | P1 |
| DE-9 | **Failure history.** List recent failed and missed instalments with reason and outcome. | P1 |
| DE-10 | **Audit.** Every explanation logs: rule version, reason code, text template ID. | P0 |
| DE-11 | **Free-text or pasted bank message** interpretation | P2 (would need an eval gate; out of R1) |

### 6.2 User stories and acceptance criteria

**DE-US1: Know why it failed**
*As an investor with a failed instalment, I want the reason, so I know what to fix.*
- **Given** a failure with a mapped reason (e.g., UPI daily limit exceeded), **then** the notice and the SIP screen show the plain reason, the SIP status and one next action.
- **Given** an unmapped code, **then** the generic message appears and support is offered; no guessed reason.

**DE-US2: Know if the SIP is alive**
- **Given** a failure, **then** the status line reads one of the defined states and is consistent in the notice, SIP screen and history.

**DE-US3: Know what to do next**
- **Then** exactly one primary action is shown, and it is executable from the screen or deep-links correctly.

**DE-US4: Deterministic and testable**
- **Given** the same input and rules version, **then** the output is byte-identical. Unit tests cover every mapped code and the fallback. No call to any model.

**DE-US5: No false reassurance**
- **Given** the rules table has no verified consequence rule for a case, **then** the text says nothing about fees or cancellation rather than guessing.

---

## 7. MODULE 3: PAUSE AND RESTART (P1)

**Purpose.** A temporary cash-flow shock should not become a permanent lapse because options are unclear. [F] P02 paused, was unsure what pause does, and had not restarted three months later; 1 of the 6 who changed course gave a cash-flow reason; 3/26 chose easier pause or edit controls. [H] A clear pause with a chosen return date and an opt-in reminder raises reactivation.

### 7.1 Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| PR-1 | **Explain the options** side by side before action: *pause*, *reduce amount*, *cancel*: what each does to the mandate, future debits, existing units and charges (only facts verified in the rules table). | P1 |
| PR-2 | **User-selected pause dates.** The user picks a pause start (default: next debit) and a pause end date or "until I resume". | P1 |
| PR-3 | **Status display.** SIP status shown wherever the SIP appears: *Active*, *Paused until [date]*, *Paused (no end date)*, *Cancelled*. Includes next debit date if active. | P1 |
| PR-4 | **Confirmation** shows what happens next in plain language (next debit date, what stays, how to resume). | P1 |
| PR-5 | **Opt-in restart reminder.** Unchecked by default. The user chooses whether to be reminded, when, and by which channel. | P1 |
| PR-6 | **Never pressure.** Reminders are neutral and factual ("Your SIP is paused until [date]. Resume, extend or leave it."); no guilt, loss framing, streaks or urgency; one reminder at the user-chosen time, no escalation. | P1 |
| PR-7 | **Resume, extend or cancel** from the reminder and from the SIP screen in at most two taps. | P1 |
| PR-8 | **Reduce amount** as an alternative offered neutrally during pause, never as a recommended default. | P1 |
| PR-9 | **No reminder without opt-in.** If the user did not opt in, no restart message is sent. | P1 |
| PR-10 | **Respect mandate reality.** Show mandate implications only as verified; if the platform cannot pause a mandate, say what it does instead. | P1 |
| PR-11 | **Audit and undo.** Log every pause, resume and reminder; allow immediate undo of an accidental pause where supported. | P1 |

### 7.2 User stories and acceptance criteria

**PR-US1: Pause on my terms**
*As an investor facing a cash-flow squeeze, I want to pause until a date I choose.*
- **Given** I select Pause, **then** I choose the dates, see what pause does, confirm, and see "Paused until [date]" on the SIP.

**PR-US2: Understand pause vs reduce vs cancel**
- **Then** the three options are shown together with plain consequences, none preselected, and no option is framed as "better".

**PR-US3: Opt-in reminder only**
- **Given** the opt-in is unchecked, **then** I receive no restart message. **Given** I opt in, **then** I receive exactly one neutral reminder at my chosen time, with Resume, Extend and Leave paused actions.

**PR-US4: No pressure**
- **Then** reminder and screen copy pass the pressure-language linter (no urgency, loss, guilt, streak or comparison language).

**PR-US5: Know my status**
- **Then** the SIP status is identical in the SIP list, detail and any notice.

---

## 8. Non-functional requirements

| Area | Requirement |
|---|---|
| **Accuracy** | Figures shown equal the account's figures to the displayed precision. Rule outputs reproducible. 0 invented numbers, fees or limits. |
| **Latency** | Return Coach (template) p95 under 1.5 s; with model rephrasing p95 under 4 s with timeout fallback to templates; Debit Explainer p95 under 500 ms. [A] targets, to be agreed. |
| **Availability** | Core SIP screens never depend on the Coach; if the Coach or model fails, the screen degrades to the standard view and templates. |
| **Determinism** | Modules 2 and 3 fully deterministic. Module 1's facts deterministic; any model output validated. |
| **Explainability** | Every answer links to its inputs, rule or source. |
| **Accessibility** | Screen-reader labels, sufficient contrast, scalable text, no colour-only status. |
| **Localisation** | English at launch; Hindi and Hinglish tested before any claim of support. |
| **Auditability** | Versioned rules table, content and prompts; logs of rule IDs and template IDs. |
| **Scalability** | Stateless services; no per-user model fine-tuning. |
| **Maintainability** | Rules and content editable by non-engineers with review and versioning. |
| **Observability** | Metrics for fallback rate, refusal rate, validator rejections, latency, errors. |
| **Cost** | Cost per answered query tracked; model use optional and capped. |

---

## 9. Privacy and financial safety requirements

**Financial safety**
- FS-1. No investment advice. No recommendation to continue, stop, buy, sell, switch or choose a fund or stock.
- FS-2. No predictions or promises of returns. "Typical at this stage" is descriptive, dated and sourced, or omitted.
- FS-3. No fear, FOMO, urgency, scarcity, loss framing or social-proof pressure anywhere, including notifications.
- FS-4. Visible "Not investment advice" on every surface; refusal template for advice requests.
- FS-5. Safe fallback instead of guessing; never state fee amounts, penalties, limits or deadlines unless verified in the rules table.
- FS-6. Compliance and legal review of all copy, the refusal text and the "typical at this stage" language before launch.
- FS-7. Reminders only when the user opts in, once, at a time the user sets.
- FS-8. A pressure-language linter and a banned-phrase list run in CI on all user-facing copy.

**Privacy**
- PV-1. Data minimisation: use only the figures needed (invested, current value, return, XIRR, dates, SIP status, failure reason code). Do not request or store account numbers, PAN or portfolio screenshots from research participants.
- PV-2. If an external model is used, send only the structured figures needed, with names, contact details, PAN, bank and account details removed. No raw documents or screenshots. [A] a data-processing agreement, a no-training setting and retention terms are required before use.
- PV-3. Logs store rule IDs, template IDs, confidence labels and masked inputs; free text is PII-masked before storage; retention period defined and short.
- PV-4. User consent and a clear explanation of what the Coach reads; the user can turn the feature off.
- PV-5. Research data stays anonymised; interview and survey data are not used in the product.
- PV-6. Access to logs restricted and audited.
- PV-7. Compliance with applicable Indian data-protection and SEBI requirements, to be confirmed by legal. [A]

---

## 10. Quality and evaluation requirements

1. **Eval gate (targets, not results).** Before any model rephrasing ships: a new golden set of about 40 hand-labelled scenarios (about 20 return situations, 20 failure messages or debit cases, plus advice-seeking prompts). Proposed thresholds: ≥95% correct on rule questions, **100% refusal** on advice prompts, **0** invented fees, limits or numbers, correct fallback when confidence is low. The existing 20-item golden set in the engine repository is **not** usable for this: it labels public reviews, and its engine labels are hard-coded.
2. **Blind labelling.** Labellers do not see model outputs; a second labeller checks a sample.
3. **Confidence-label rules** are explicit and tested: *High* only if all required figures present, tenure computed, situation matched a rule, and a source attached; *Medium* if data partial or general education only; *Low* triggers the fallback.
4. **Red-team set** for indirect advice prompts, prompt injection and attempts to extract predictions.
5. **Debit Explainer tests:** one unit test per mapped reason code, plus unknown-code and edge cases.
6. **Content QA:** clarity check with at least 3 target users; "felt like advice?" must be near zero.

## 11. Metrics (proposed targets only; no baselines exist)

- **North Star:** 12-month active SIP rate, first-time cohort. Active = at least one successful instalment in the last 30 days. Proposed decomposition `A₁₂ = S + (1 − S) × r` (see `problem-statement.md` §7); all terms to be instrumented.
- **Primary proxies:** 90-day continuation among exposed first-year users vs a holdout; pause or cancel within 30 days of a flat or red figure; 7-day recovery after a failed debit; reactivation within 60 days of a pause.
- **Leading:** Coach opens from flat/red screens; comprehension check (≥2 of 3 correct); opt-in rate for reminders.
- **Guardrails:** advice-refusal compliance 100%; "felt like advice" near 0; no rise in cancellations, complaints, support contacts or notification opt-outs; no rise in amount reductions.
- **AI quality:** fallback rate, validator rejection rate, invented-number rate (0), source-present rate (100%), latency.
- Full definitions belong in `metrics-framework.md` and `guardrail-metrics.md`.

## 12. Dependencies

| Dependency | Why | Status |
|---|---|---|
| Access to the user's SIP figures (invested, current value, return, XIRR, instalment dates, SIP status) | RC-1, RC-2, PR-3 | [A] to confirm; the MVP may use user-entered or test-account figures |
| Payment and mandate failure reason codes and retry status from the payment or mandate provider | DE-1, DE-5 | [A] to confirm availability and code list |
| Verified rules table: bank, UPI and e-mandate rules, AMC rules, consecutive-failure policy, charges | DE-2, DE-6, PR-1 | **Not verified in this project**; must be sourced and reviewed |
| Platform ability to pause, set a pause end date, resume and reduce a SIP and to pause or keep a mandate | PR-2, PR-5, PR-10 | [A] to confirm. The INDmoney page found describes managing SIPs in the SIP Centre; pause with a date was not confirmed |
| Notification service with opt-in and per-user scheduling | PR-5, DE-8 | [A] |
| Vetted content and source library (AMFI, SEBI, AMC, INDmoney help) | RC-5 to RC-7 | To be authored and dated |
| Compliance and legal review | FS-6 | Required before launch |
| 40-scenario golden set and labellers | §10 | Not yet built |
| Model provider agreement (data handling, no training, retention) | PV-2 | Only if a model is used |
| Analytics instrumentation and an experimentation framework with holdouts | §11 | To be built |
| Design assets and the INDmoney design system | UI | Available in the project (`docs/` design system) |

## 13. Out of scope

- Fund, stock or portfolio recommendations; rebalancing; "should I continue" guidance.
- Forecasts, projections or "expected return" calculators.
- Automated SIP amount recommendation or sizing (P-H3 is only partially validated).
- Proactive urgency, streaks, gamification, countdowns or loss-framed nudges.
- Cross-sell cleanup, support-resolution tooling, and tax or charges explanation (T8, T9, T10 unvalidated).
- Goal tracker (considered but not selected).
- Free-text or pasted bank-message interpretation by a model in R1.
- Hindi, Hinglish or other languages in R1.
- Changes to mandate or payment infrastructure; building new payment methods.
- Any research on or use of respondents' account numbers, PAN or portfolio screenshots.
- Comparisons with other platforms' products or funds.

## 14. Risks and open questions

| Risk or question | Mitigation or next step |
|---|---|
| Explanation is read as advice | Fixed refusal, descriptive wording, compliance review, "felt like advice" metric |
| "Typical at this stage" read as a prediction | Omit unless a vetted, dated source exists; describe past patterns only |
| Model invents content | Templates first; validator; eval gate; 0 invented numbers |
| Rules table wrong or stale | Source and owner per rule; version and review cadence |
| Cannot access user figures or failure codes | MVP with test accounts or user-entered figures; confirm integration early |
| Pause not supported as designed | Confirm platform capability before building Module 3 |
| Notification fatigue or pressure | Opt-in only, one reminder, user-set time, linter |
| Effect on retention is unproven | Holdout experiments with guardrails; no claims before results |
| Evidence base: selected segment is 5 Groww and 4 INDmoney; only P01 is an INDmoney interview in-segment; survey rows R22–R26 mirror P01–P05 | Interview 3–4 more INDmoney first-year investors; disclose N=26 composition; show N=21 sensitivity |
| Whether P01–P05 are verbatim recruited interviews or adapted | Owner to state this honestly in the deck |

## 15. Traceability to research

| Requirement area | Evidence | Type |
|---|---|---|
| Return Coach (RC-1…17) | 13/26 confused; 16/26 confidence 1–3; 9/26 chose clearer explanations; 12/26 expected quick returns; P01, P05 | [F] problem, [H] solution |
| Refusal and "not advice" | Brief constraints; P01: "Not advice, just what usually happens" | [F] |
| Debit Explainer (DE-1…11) | 11/26 payment issue; 4 of 11 clarity 1–2; 4/26 chose recovery, 3/26 debit visibility; P03 | [F] problem, [H] solution |
| Pause and Restart (PR-1…11) | P02; 4/26 cash-flow reason; 3/26 easier pause or edit; 1 of 6 who changed course | [F] problem, [H] solution |
| Quiet by default, no pressure | P04; 9/26 never considered a change; brief constraints | [F] |
| Not independent: P00 | Researcher-user account, context only | Context |

## 16. Open items for the owner
1. Confirm which user figures and failure codes are accessible, and whether pause with a date is supported.
2. Source and verify the rules table (bank, UPI, e-mandate, AMC, charges).
3. Decide whether an LLM is used in R1 or templates only.
4. Name the content owner and legal reviewer.
5. Build the 40-scenario golden set.
6. Run additional interviews and a usability test with at least 3 target users; report real results.
