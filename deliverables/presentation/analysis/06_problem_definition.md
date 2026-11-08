# 06 Problem Definition: Choosing One SIP-Retention Problem

**Role:** Principal Product Manager, INDmoney | **Date:** 2026-11-02 (revision 2)
**Inputs:** `04_interview_synthesis.md`, `05_hypothesis_validation.md`, `01`-`03`, `segment_analysis.md`, P00 (pack §16), simulated interviews (pack §17), engine corpus. No PowerPoint was created or modified.

> **Revision note.** Revision 1 selected **B (mandate and payment communication)** using P00 and public signals only. Since then the five simulated interviews became the mock study's interview set and were synthesised (`04`, `05`). With that evidence, **C ranks first**; on real evidence alone, B still does (§4.4). This revision recommends **C**, keeps B as runner-up and a quick hygiene fix, and states the sensitivity openly.

---

## 1. Decision

**Primary problem: C, cash-flow constraints and contribution flexibility**, framed as: *the SIP instalment stops fitting the investor's cash flow, and the only options are to let it fail, pause, or cancel, with no path back.*

| | |
|:---|:---|
| **Confidence** | Low to moderate. C leads B by 3 points (base weights) in the mock study; B leads C by 5 points on real evidence alone. |
| **Why C, not the highest-frequency theme** | A has the most public mentions, but in every interview worry about returns did not lead to stopping. C is where the one observed stop happened, and it has the most direct causal link to "active at month 12". |
| **Runner-up** | B: P00's failed-debit experience is real and the fix is cheap, but no failure in the evidence led to stopping. Ship its communication fix as hygiene alongside C (§6). |
| **Main risk** | C's lead rests largely on one simulated participant (SIM-P02) whose outcome was authored to test the cash-flow hypothesis. If the team does not accept simulated outcomes as evidence, choose B. |

---

## 2. Evidence base

| Evidence | Standing in this mock study | Used for |
|:---|:---|:---|
| **P00** (pack §16) | Real interview, n = 1; project owner; continuing user; not independent | Primary research, labelled "researcher-user" |
| **SIM-P01 to SIM-P05** (pack §17) | **Simulated** interviews; SIM-P05 is Groww | Primary research **in the mock study**, labelled "simulated" |
| **Public reviews** (engine corpus; raw INDmoney reviews) | Real public signals; keyword-coded | Frequency; wording |
| **Mock survey** (35 rows) | Constructed data | Shown as n/N for context; **not scored** |
| **Engine themes and scores** | Hard-coded insights; rating-derived fields for 90.9% of rows | Challenged (§3), not scored |

Quotes in curly quotation marks are verbatim from their source file. Simulated quotes are marked [simulated].

---

## 3. Challenging the AI engine

| # | Engine assumption | Finding |
|:--|:---|:---|
| 1 | Top blockers are Information Desert (0.834) and Red Portfolio Panic (0.822) | Scores rank keyword rules and hand-set actionability constants over rows that are rating-derived for 2,798 of 3,079 (`05` row 12: INCONCLUSIVE) |
| 2 | Paper losses cause panic and drop-off | P00 and the targets worry but continue; no one in the evidence stopped over returns (`05` row 2: REFRAMED) |
| 3 | Months 3-6 hold 54.2% / 73% of drop-off | Not reproducible: 6 of 68 tenure-tagged rows; survey has no churn-timing item (`05` row 4: CHALLENGED) |
| 4 | "10x", "3x", "single largest driver" | Literal strings in `stage3_cluster.py`, not computed (`05` rows 3, 7, 8: CHALLENGED) |
| 5 | Payment friction is about fear of penalties and missed NAV windows | No one mentioned NAV windows; the gap is preparedness and explanation (`05` row 5: REFRAMED). The `mandate_payment` category is mostly US-stock funding, withdrawals and brokerage |
| 6 | The theme list covers the problem space | **The engine has no flexibility, pause/restart or cash-flow theme**, and no tax/charges field. C is a blind spot the primary research surfaced (`05` §5) |

---

## 4. Evaluation

### 4.1 Public signals (INDmoney; keyword flags, approximate)

| Area | INDmoney rows (of 1,114) | SIP-explicit (of 271) | After reading the rows |
|:---|:--:|:--:|:---|
| A. Performance confusion | 155 | 45 | Mostly requests to show XIRR/CAGR/returns; little "is this normal?" panic |
| B. Mandate/payment comms | 14 | 3 | No review clearly describes a failed SIP debit (raw check: 0 of 6 pattern hits in 251 raw SIP-explicit reviews) |
| C. Cash flow & flexibility | 16 | 11 | About 8 of 251 raw SIP-explicit reviews describe SIP control gaps: pause-only with no stop/delete, cannot unpause (app closes), edit "coming soon", fixed-amount step-up only, cannot remove a mandate. None mentions cash-flow stress. Review dates not checked |
| D. Education & transparency | 121 | 36 | An umbrella of unrelated gaps |
| E. Tax & cost | 96 | 16 | Mostly trading brokerage and US-stock fees |

### 4.2 Primary research (P00 kept separate from the five targets)

| Area | P00 (real) | Five targets (simulated) | `05` verdict |
|:---|:---|:---|:---|
| A | Anxious when red but continues: “I just ignore it and continue my SIP” | P01 and P05 unsure if returns were normal, both continued; P04 calm | REFRAMED / CHALLENGED |
| B | Failed debit, ₹300 bank charge (participant-reported), no notification recalled, resumed automatically | P03: notification without reason or next step; continued | REFRAMED |
| C | Amount chosen so as not to default: “I knew I would not default for such an amount”; the failed debit was caused by **insufficient balance**; would temporarily pause if pocket money fell; no difficulty pausing so far | **P02 paused at ~month 7 for cash flow and never restarted** (the only stop in the set); P04 protected by a budgeted amount and post-salary date; amount mattered for P01, P02, P03, P04 | Not a separate engine row; H4 in pack §17 = INCONCLUSIVE; `05` §5 lists it as an engine blind spot |
| D | Self-taught terms; wants explanations | 4 of 5 hit an unexplained moment (returns, failure, pause) | CONFIRMED (Information Desert) |
| E | Wants itemised taxes and charges | Not raised | INCONCLUSIVE |

**Mock survey context (constructed, not scored):** cash flow or unexpected expense was the main reason for 3/23 who considered a change, and all 3 made one; "hard to maintain the monthly amount" 4/35; "easier way to adjust, pause or restart" requested by 4/35; mandate/bank issue the reason for 6/23, of whom 4 continued.

### 4.3 Scoring (1-5; analyst judgement)

| Criterion (weight) | A | B | C | D | E |
|:---|:--:|:--:|:--:|:--:|:--:|
| 1. Evidence frequency (10%) | 4 | 1 | 2 | 3 | 2 |
| 2. Severity / user impact (20%) | 3 | 4 | 4 | 2 | 2 |
| 3. Primary research validation (15%) | 3 | 3 | 3 | 4 | 2 |
| 4. First-time-investor relevance (10%) | 4 | 3 | 3 | 4 | 2 |
| 5. Link to 12-month active SIP (20%) | 2 | 3 | 4 | 2 | 1 |
| 6. Product actionability (15%) | 3 | 5 | 4 | 3 | 2 |
| 7. Confidence in the evidence (10%) | 2 | 2 | 2 | 3 | 2 |
| **Weighted score (/100)** | **58.0** | **64.0** | **67.0** | **57.0** | **36.0** |

**Rationale for the scores that decide the ranking**
- **Severity.** C = 4: the one observed stop ended a SIP outright (P02), and P00's charge came from a balance shortfall. B = 4: money lost and trust dented, but no stop.
- **Primary validation.** D = 4 (P00 plus 4 of 5). A, B, C = 3 each. B rests on P00 and P03; C rests on P02, the protective-amount pattern in 4 of 5, and P00's own affordability strategy.
- **Link to the metric.** C = 4: pause/cancel is the event that ends an active SIP, and a cash-flow shock triggered the only stop. B = 3 (down from 4 in revision 1): a failed debit breaks one instalment, but P00 and P03 both resumed. A = 2: worry did not lead to stopping in any interview.
- **Actionability.** B = 5 (message, timing, retry are in INDmoney's control). C = 4: step-down, skip and date changes are buildable but subject to mandate and bank rules, which need verification.
- **First-time relevance.** No dataset can establish it. Targets are first-time by construction (invented); P00's status is unconfirmed.

### 4.4 Sensitivity

| Weights | Mock study (P00 + public + simulated) | Real evidence only (P00 + public) |
|:---|:---|:---|
| Base | **C 67.0**, B 64.0, A 58.0, D 57.0, E 36.0 | **B 68.0**, C 63.0, A 59.0, D 47.0, E 36.0 |
| Equal | **C 62.9**, D 60.0, B 60.0, A 60.0, E 37.1 | **B 62.9**, C 60.0, A 60.0, D 48.6, E 37.1 |
| Frequency-heavy | **A 64.4**, D 58.2, C 56.2, B 47.6, E 37.6 | **A 65.0**, C 53.8, D 51.0, B 50.0, E 37.6 |
| Metric + actionability heavy | **C 73.0**, B 71.0, D 54.0, A 54.0, E 33.0 | **B 78.0**, C 71.0, A 59.0, D 48.0, E 33.0 |
| Primary research x2 | **C 66.1**, B 63.5, D 60.0, A 58.3, E 36.5 | **B 67.0**, C 62.6, A 56.5, D 46.1, E 36.5 |

**Reading:** C and B are the top two whenever frequency isn't dominant. Which comes first depends on whether simulated outcomes count. A wins only if frequency dominates, and frequency is the least trustworthy input (keyword hits on unhappy reviews).

---

## 5. P00's experience, mapped

| P00 point | Interpretation in this revision |
|:---|:---|
| **₹300 bank charge after a failed debit** | The debit failed because of **insufficient balance**: a cash-flow timing collision (C) with a communication gap layered on top (B). Participant-reported; fee type and charging party unverified; not shown to be INDmoney's charge |
| **No failure notification recalled** | A B-component. Not sent, sent but missed, or wrong channel: **notification logs needed**. Addressed by the hygiene fix (§6) |
| **Day-before debit reminder** | Serves C directly: a reminder only helps if the user can act on it (top up, **skip this month**, **lower the amount**, or **shift the date**) |
| **Itemised profit, taxes and charges** | E; not prioritised (§6). Instrument unclear |
| **Evidence-backed, voluntary explanations** | Design constraint: any prompt about pausing, lowering or skipping must state consequences factually, be optional, and never advise on whether to invest |
| **One longitudinal user** | P00 has never had a cash-flow shock and reports no difficulty pausing. That limits P00 as evidence of a *flexibility* gap, but P00's affordability strategy and balance-shortfall failure both point at cash-flow fit |

---

## 6. Why C, and why not the others

**C: selected.**
- The only stop in the evidence was cash-flow-driven (P02, simulated), and it became permanent through "pause then forget".
- The protective pattern in the evidence is cash-flow fit: affordable amount (P00, P01, P03), pay-date alignment (P04).
- P00's one incident was a balance shortfall on the debit date.
- Public INDmoney reviews show SIP control gaps (pause-only, cannot unpause, edit "coming soon").
- The engine has no theme for any of this, so it is the clearest place where primary research adds something new.

**B: runner-up; ship its communication fix as hygiene.**
- Real first-hand evidence (P00) and the highest actionability.
- But no failure in the evidence led to stopping, and the public corpus has essentially no failed-SIP-debit reviews.
- Its root cause in P00's case (insufficient balance) sits inside C. A failure message with reason, SIP status and next step is cheap and low-risk; build it with C but don't make it the primary bet.

**A: not prioritised.** Highest keyword frequency, but the texts mostly ask to *see* returns data, and worry did not lead to stopping in any interview. The months 3-6 window rests on unreproducible figures.

**D: not prioritised as the primary problem.** The information gap is the best-corroborated pattern (CONFIRMED), but no one stopped because of it, and "education" is an umbrella, not one problem. Its strongest instances (what pause does, why a debit failed) are folded into C and the B fix.

**E: not prioritised.** Taxes and charges bite mostly at redemption, after the 12-month window; P00 is the only source and the instrument is unclear; tax estimates carry liability.

---

## 7. Problem statement

**User.** A first-time SIP investor on INDmoney with a small, fixed monthly instalment paid by auto-debit, whose income or account balance is not steady month to month (e.g. a student on pocket money such as P00; a variable-income earner such as SIM-P02 [simulated]).

**Situation.** At some point the instalment collides with their cash flow:
- **on the debit date**, the balance is short and the debit fails, sometimes with a bank charge they discover later (P00: “I actually found ₹300 deducted as a penalty”); or
- **over a stretch of months**, income drops and they have to stop paying (SIM-P02: “The money was needed for rent. The SIP wasn't the problem, I was.” [simulated]).

At that moment the realistic choices are let it fail, pause, or cancel. A pause is unclear (“I wasn't sure if pausing kept my mandate on or if I'd get charged.” [simulated]) and has no route back (“It's been three months. No reminder asked me to restart. I just forgot, and then it felt awkward.” [simulated]).

**Root cause (hypothesis).** The SIP is set up as a fixed amount on a fixed date and never re-checked against the investor's cash flow. Lighter-touch adjustments that would keep it alive (lower the amount, skip one instalment, move the date) are absent, hard to find or unclear; public reviews report pause-only controls and edit "coming soon". And a pause has no designed exit back to the plan.

**Existing workarounds.**
- Start with a deliberately small amount (P00: “I knew I would not default for such an amount”; SIM-P03: “to be safe” [simulated]).
- Align the date with payday (SIM-P04: “so it never competes with rent.” [simulated]).
- Pause and hope to remember (SIM-P02).
- Absorb the bank charge and investigate alone (P00).

**Unmet need.** When money is tight, to adjust the SIP to what they can afford *this month* without breaking it, to understand clearly what each option does, and to be brought back to their plan afterwards: “suggest a lower amount instead of a pause” and “A nudge to resume.” [simulated]; P00: “a heads-up a day before the SIP”.

**User value.** Keep the investing habit through a cash-flow shock without bank charges, confusion or the guilt of a forgotten pause; stay in control of an amount that fits.

**Business value.** Fewer cancellations and permanently paused SIPs, fewer failed debits and related support contacts, and higher trust at a vulnerable moment. *The effect on 12-month active SIPs is the hypothesis to test; no figure is claimed.* Revenue effects depend on commercial terms not assessed here.

**Guardrail.** The aim is to keep a SIP alive *at a level the user can afford*, not to keep money flowing that the user needs. No prompt should discourage a legitimate stop or imply that continuing is always right (pack §14).

---

## 8. Validation gates and metric

**Define the metric first.** Does a paused SIP count as active at month 12? Does a stepped-down SIP? C's success depends on the answer.

| Gate | Evidence needed | Source |
|:---|:---|:---|
| 1. Incidence | Share of first-time SIP users who pause, cancel or fail on insufficient balance in months 1-12 | INDmoney SIP and debit data |
| 2. Pause outcome | Share of pauses that resume, and time to resume | SIP state data |
| 3. Current capability | What exists today: step-down, skip, date change, resume prompts (reviews may be outdated) | Product audit |
| 4. Rules | Mandate and bank constraints on lowering, skipping or moving a date; who levies failure charges | AMC/bank/mandate rules |
| 5. Failure communication (for the B fix) | What is sent on failure, on which channel, and whether it is opened | Notification logs |
| 6. Real interviews | At least 5 real users, including 2 or more who paused or stopped for cash-flow reasons | Fieldwork |

**Pre-agreed pivot:** if Gates 1-2 show pauses and cancellations are rare or mostly resume, switch to B (and keep the failure-communication fix in either case).

**Leading indicators:** step-down/skip used instead of cancel; pause-to-resume rate; time paused; failed debits from insufficient balance. **Guardrails:** cancellation-request handling time (stopping must stay easy), complaint volume, opt-out of nudges, no advice content.

---

## 9. Open questions
1. How does the 12-month metric treat paused and stepped-down SIPs?
2. What adjustment controls does INDmoney offer today, and were the "coming soon" and pause-only issues resolved?
3. Do mandate rules allow lowering or skipping an instalment without a new mandate?
4. Can P00 confirm first-time status, start date, and which instrument the itemisation request covers? (pack §16.8)
5. Will the team accept the mock study's simulated outcomes as decisive? If not, B is the recommendation.
