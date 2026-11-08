# 07 Solution Decision: Three Options, One MVP

**Role:** Product Strategy Lead | **Date:** 2026-11-02
**Problem (approved, `06_problem_definition.md` rev. 2):** *A first-time SIP investor's fixed instalment stops fitting their cash flow, on the debit date (balance short) or over a stretch of months (income drop), and the only options are to let it fail, pause, or cancel, with no route back.*
**Constraints:** no investment advice; no fund or stock recommendations; no fear, FOMO or urgency; stopping must stay easy.

> **Evidence standing.** P00 = real (n = 1); SIM-P01 to SIM-P05 = simulated (mock study, pack §17); public reviews = real public signals. **No INDmoney product data is available**, so every Reach, Impact, Confidence and Effort input below is a *planning assumption*, labelled as such and stress-tested in §3.3. Quotes in curly quotation marks are verbatim; simulated ones are tagged [simulated].

---

## 1. What any solution must do (from the evidence)

| Need | Evidence |
|:---|:---|
| N1. Let the user act *before* the debit (top up, skip, lower, move) | P00: “a heads-up a day before the SIP”; the debit failed on insufficient balance. SIM-P03: “I'd also like a reminder the day before.” [simulated] |
| N2. Offer a lighter alternative to pause/cancel | SIM-P02: “suggest a lower amount instead of a pause” [simulated]; public reviews: pause-only controls, edit "coming soon" |
| N3. Make each option's consequence clear | SIM-P02: “I wasn't sure if pausing kept my mandate on or if I'd get charged.” [simulated] |
| N4. A route back after a pause | SIM-P02: “No reminder asked me to restart.” [simulated] |
| N5. If a debit fails anyway, explain reason, SIP status, next step | SIM-P03: “It told me it failed. It didn't tell me why or what to do.” [simulated]; P00 recalled no notification |
| N6. Explanations factual, optional, sourced, uncertainty-aware | P00 interview §16.2 Q13 (paraphrase) |
| N7. Don't make continuing feel obligatory | SIM-P04: “Don't make me do things to keep my SIP going.” [simulated]; pack §14 |

---

## 2. Three differentiated solutions

### S1: Flexible SIP Controls (self-serve, reactive)
A redesigned SIP management screen: **skip one instalment**, **lower the amount (this month or ongoing)**, **change the date**, and **pause with a chosen resume date**. Each option shows a plain consequence summary ("what happens to your mandate, your next debit, any charges the platform knows of"). The failure screen shows reason, SIP status and next step.
*Differentiator:* gives users the tools, but only helps those who go looking at the right moment.

### S2: Pre-debit SIP Check-in (proactive, rules-based)
Before each debit (default one day; user-configurable or off), a calm, optional message: *"Your ₹X SIP is scheduled for [date]. Nothing to do if that still works."* It offers one-tap choices: **keep as planned**, **skip this month**, **lower this month**, **move the date**. Pauses always carry a resume date and one resume reminder. Failed debits get a reason, SIP-status and next-step explainer. Includes the minimal control set from S1 needed to act on the check-in.
*Differentiator:* meets the user at the moment of collision (N1) and turns a binary pay/fail event into a choice.

### S3: AI Cash-flow Companion (predictive and conversational)
Uses consented bank-transaction data (e.g. via an Account Aggregator) to **predict** debits at risk of failing and learn the user's income timing, then nudges only at-risk users. Adds an **LLM assistant** that answers free-form questions about the user's own SIP ("what happens if I skip twice?"), grounded in the user's SIP data and published scheme and mandate rules, with sources and an explicit refusal of advice. Builds on S2's actions.
*Differentiator:* personalised timing and open-ended explanation, at the cost of data access, trust and compliance risk.

---

## 3. RICE

### 3.1 Inputs (planning assumptions, not data)

Reach = of every **100 first-time SIP investors in a quarter**, how many meet the solution at a relevant moment. Impact uses the standard scale (3 massive, 2 high, 1 medium, 0.5 low, 0.25 minimal), averaged over everyone reached. Confidence: 100 / 80 / 50 / 20%. Effort in person-months.

| | S1 Flexible Controls | S2 Pre-debit Check-in | S3 AI Companion |
|:---|:---|:---|:---|
| **Reach** | **10**: only those who navigate to SIP settings during a cash-flow moment (SIM-P02 did look for how to reduce; most users "set and forget": SIM-P03) | **100**: every user with a scheduled debit gets the check-in | **30**: only users flagged as at-risk and who have consented to share bank data |
| **Impact** | **2**: high for the few who find it (an alternative to cancelling) | **0.5**: low on average, because most users need nothing; high for the at-risk minority | **1**: medium; better targeting, but still depends on the same actions |
| **Confidence** | **50%**: P02 [simulated], public control-gap reviews, P00's affordability logic | **50%**: P00 asked for exactly this; P03 [simulated]; reminder fatigue untested | **20%**: no evidence users will consent to bank data for this; prediction accuracy unknown |
| **Effort** | **3**: UI, controls, consequence copy; subject to mandate/AMC rules | **5**: notification scheduling, preferences, deep-linked actions, explainer, plus minimal controls | **10**: AA integration, consent flows, model, LLM grounding and evaluation, compliance review, plus S2 |

### 3.2 Scores

| | Reach | Impact | Confidence | Effort | **RICE** |
|:---|:--:|:--:|:--:|:--:|:--:|
| S1 Flexible Controls | 10 | 2 | 0.5 | 3 | **3.3** |
| **S2 Pre-debit Check-in** | 100 | 0.5 | 0.5 | 5 | **5.0** |
| S3 AI Companion | 30 | 1 | 0.2 | 10 | **0.6** |

### 3.3 Sensitivity: when does the winner change?

| Change to S2's inputs | S2 RICE | Winner |
|:---|:--:|:---|
| Base | 5.0 | S2 |
| Impact halves (0.25), e.g. reminder fatigue | 2.5 | **S1 (3.3)** |
| Effort rises to 8 | 3.1 | **S1 (3.3)** |
| Confidence drops to 20% | 2.0 | **S1 (3.3)** |
| S1 reach doubles to 20 (S1 = 6.7) | 5.0 | **S1** |
| S3 confidence 50% and effort 6 (S3 = 2.5) | 5.0 | S2 |

**Reading:** S2 beats S1 only if a short, calm reminder helps some at-risk users without wearing out the rest. That is the key uncertainty to test (§6 and `08` §10). S3 does not win under any reasonable input; its inputs would need to change by large factors.

---

## 4. Beyond RICE

| Criterion | S1 Flexible Controls | S2 Pre-debit Check-in | S3 AI Companion |
|:---|:---|:---|:---|
| **User trust** | High: user-initiated, transparent | High if calm, optional and infrequent; risk of feeling nagged | **Lowest**: asks for bank-transaction access; a model "watching" balances may feel intrusive; LLM errors damage trust |
| **Technical feasibility** | High; depends on mandate/AMC support for skip/lower/move | High; notification infrastructure exists in most apps (verify); same control dependencies as S1 | Medium-low: AA integration, prediction quality, LLM grounding and evaluation |
| **Product dependencies** | Mandate and RTA/AMC rules for skip, step-down and date change; payment status codes | All S1 dependencies + notification scheduler + preference centre; must not clash with the bank's or UPI app's own pre-debit message (verify NPCI rules) | All S2 dependencies + AA licence/partner + consent management + model ops + compliance sign-off |
| **AI necessity** | None | None: options are few and deterministic | Required for prediction and free-form Q&A, neither of which the evidence shows is needed yet |
| **Financial safety** | Safe: the user chooses; no amount is recommended | Safe if options are presented neutrally and stopping stays one tap away; no "recommended amount" | **Riskiest:** a predictive nudge ("you may be short") edges toward personalised financial guidance; LLM may drift into advice |
| **Retention impact** | Real but narrow: helps only those who find it | Broadest plausible: intercepts every collision before it becomes a failure or a cancellation | Possibly highest per targeted user, but gated by consent, so reach is uncertain |

---

## 5. Decision: **S2, the Pre-debit SIP Check-in**, is the MVP

### 5.1 Why S2 wins
1. **It acts at the moment the problem happens.** Both collisions in the evidence happen at or around a debit: P00's balance shortfall and SIM-P02's month-7 income drop. S2 is the only option that reaches the user *before* the debit without them having to go looking.
2. **It answers every need N1-N7** with deterministic, auditable behaviour: reminder (N1), lighter options (N2), consequence copy (N3), resume date and reminder (N4), failure explainer (N5), factual and optional (N6), and "nothing to do" as the default (N7).
3. **Highest RICE at base** (5.0 vs 3.3 vs 0.6), at moderate effort and with no new data access.
4. **It contains B's hygiene fix** (failure explanation), so P00's real experience is addressed without making B the primary bet.
5. **It is safe:** no amounts recommended, no advice, stopping stays easy, and the default is to do nothing.

### 5.2 What the alternatives miss
- **S1** builds the right tools but leaves timing to the user. SIM-P03 [simulated] and P00 both "set and forget"; they would not open settings before a shortfall. S1's controls ship *inside* S2 anyway.
- **S3** solves problems the evidence hasn't shown: no one asked for prediction or a chatbot, and P00 asked for *optional, sourced* explanations. It needs bank-data consent, and its prediction is the most advice-like thing in the set. It is a possible later phase, not an MVP.

### 5.3 Is AI needed? **Not for the MVP.**
- The MVP's decisions are deterministic: a scheduled date, a fixed option set, known mandate states and enumerable failure codes. Rules and templates handle all of them exactly and auditably.
- AI would add risk where it adds least: an LLM writing consequence text could misstate a mandate rule or drift into advice, and P00 explicitly wants factual, sourced explanations.
- **Where AI could earn a place (phase 2, behind gates in `08` §11):** a grounded "Ask about my SIP" assistant, but only if MVP data shows frequent questions the templates can't answer (e.g. high help-search volume after check-ins), and only with retrieval from the user's own SIP and published rules, sources shown, and refusal of advice.

### 5.4 What a non-AI version misses
The MVP *is* the non-AI version. Compared with S3 it gives up:
- **Personalised timing.** Everyone gets the same lead time (default one day) instead of a reminder timed to the user's income pattern. Mitigation: user-configurable timing.
- **Targeting.** It messages every user rather than only at-risk ones, which means more exposure and fatigue risk. Mitigation: one message per debit, calm copy, easy opt-out; measure opt-outs.
- **Open-ended questions.** Questions outside the template set go to help content.
- **Early warning from patterns** (e.g. repeated skips). A rule ("second skip in three months shows a neutral check-in about lowering the amount") covers most of this without AI.

---

## 6. How success will be measured (summary; full detail in `08` §9)

| Type | Metric |
|:---|:---|
| **North Star** | Share of first-time SIP investors whose SIP is **active at month 12** (definition to be agreed; proposed in `08` §9.1) |
| **Leading indicators** | Share of debit-date collisions resolved by skip/lower/move instead of failing or cancelling; failed debits due to insufficient balance per 100 scheduled; pause-to-resume rate by the chosen date; median time paused |
| **Engagement health** | Check-in open rate; action rate among opens; settings changes |
| **Guardrails** | Check-in opt-out rate; cancellation stays one step and its completion rate doesn't fall; complaints mentioning reminders; no rise in skips becoming permanent; zero advice content (QA audit) |
| **Method** | Randomised holdout of first-time SIP investors; read leading indicators at about 90 days; month-12 metric over the full cohort. Minimum detectable effect to be set from the real baseline (none is available now) |

---

## 7. Assumptions to verify before build
1. Which instalment actions (skip, lower for one month, move date, pause with resume date) INDmoney, the AMCs/RTAs and mandate rules support today.
2. Whether the bank or UPI app already sends a pre-debit notification (and how the check-in should coexist with it).
3. Which failure reasons and status codes INDmoney receives from payment rails.
4. Baseline rates for the North Star and leading indicators.
