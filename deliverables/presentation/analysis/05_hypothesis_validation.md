# 05 Hypothesis Validation: AI Discovery Engine vs Primary Research

**Role:** Principal User Researcher | **Date:** 2026-11-02
**Read with:** `04_interview_synthesis.md` (participant evidence), `01_evidence_audit.md`, `02_survey_analysis.md`, `segment_analysis.md`

---

## 1. Evidence key and rules

| Label | Source | Standing |
|:---|:---|:---|
| **P00** | Real researcher-user interview (pack §16) | Real, n = 1, not independent; continuing user |
| **Targets (simulated)** | SIM-P01 to SIM-P05 (`simulated_interviews/`) | Simulated; SIM-P05 is Groww |
| **Mock survey** | `survey_clean_anonymized.csv`, N = 35 | **Constructed mock data, not real respondents.** Shown as n/N for completeness; it carries no evidential weight |
| **Engine** | `data/themes/themes.json`, `pipeline/stage3_cluster.py` | Public reviews/forums; 90.9% of rows are rating-derived fallbacks |

Text inside curly quotation marks is copied word for word from the engine source or a participant file. Counts are given as n/N or "x of 5"; no invented percentages.

**Verdict definitions (adapted from pack §10.2 for this mock study):**
- **CONFIRMED:** P00 and at least two of the five targets support the claim, with no direct contradiction of its core. *This does not mean independently validated* (the simulated interviews were written with the hypotheses in view).
- **CHALLENGED:** evidence contradicts the claim, or the claim's own basis fails.
- **REFRAMED:** the signal is present but the explanation or implication differs.
- **INCONCLUSIVE:** untested or too sparse.

---

## 2. Hypothesis validation matrix

| # | Engine insight | Supporting survey evidence (mock, N = 35) | Interview evidence | Contradictions | Verdict |
|:--|:---|:---|:---|:---|:---|
| 1 | **T3 Information Desert** (score 0.834): “Data without interpretation breeds insecurity: showing a bare -4.2% XIRR without peer benchmark leaves investors stranded in confusion.” | Unsure whether returns were normal 12/35; terms or numbers hard to understand 8/35; unsure what action to take 8/35; clearer explanation of returns is the top requested change, 11/35 | **P00:** self-taught terms (“I have learned this over the internet on my own”); wants contextual explanations. **Targets (simulated):** P01 “I saw XIRR but I didn't know what it meant.”; P05 “couldn't tell if it was normal”; P02 and P03 wanted explanations of a pause and a failure | P04 needs little: “Honestly, not much.” No one stopped because of it. The engine claims insecurity, not churn, and that is all supported | **CONFIRMED** |
| 2 | **T1 Red Portfolio Panic** (score 0.822): “New investors equate paper losses with permanent capital loss because returns displays highlight red numbers without showing historical recovery timelines.” | Main reason for considering a change "disappointed or confused by performance": 8/23, of whom 6 continued and 2 changed | **P00:** anxious (“I feel anxious when I see my portfolio in red”) but “I just ignore it and continue my SIP”. **Targets:** P01 and P05 worried and continued; P04 calm; no target stopped for returns | No one equated a paper loss with permanent loss in the sources; the only stop (P02) was cash flow. P01 stayed because the loss was small | **REFRAMED:** worry and uncertainty are real; panic leading to churn is not seen |
| 3 | **T2 Expectation vs. Reality Gap** (score 0.527): “The gap between compounding promises and early-tenure reality is the single largest mental drop-off driver in Months 3 to 6.” | Expected "positive returns fairly quickly" 11/35 | **P00:** expectations not established. **Targets:** P01 expected growth “by the third month, at least”; P05 “I thought a few months would show something.” Both continued | The gap exists in 2 of 5, yet neither dropped off; only one of five stopped, for cash flow. "Single largest" is a hard-coded phrase, not a computed ranking | **CHALLENGED** (as "largest drop-off driver") |
| 4 | **Headline window:** drop-off concentrates in months 3-6 (deck/competitor docs: 54.2% / 73%) | Start-period question only: 16/35 began 3-6 months ago, which is a cohort size and says nothing about when anyone stopped. No churn-timing item exists | **P00:** none. **Targets:** doubt in months 3-5 (P01, P05) with no stop; the one pause was around month 7 (P02); P03's failure was in month 2 | Engine basis fails: 6 of 68 tenure-tagged rows are `months_3_6`; 3,011 rows have no tenure (`segment_analysis.md` §1) | **CHALLENGED** |
| 5 | **T4 Mandate & Payment Friction** (score 0.607): “Payment failures create acute anxiety because investors fear both bank bounce penalties and missing lower NAV purchase windows.” | Payment failure 9/35; mean clarity 1.89 (n = 9); 6/23 gave a mandate/bank issue as the reason for considering a change, 4 of those 6 continued | **P00:** one failed debit, a ₹300 bank charge (participant-reported), no notification recalled, concern about future penalties; SIP resumed. **Targets:** P03 failed debit with a message that gave no reason or next step; no charge | Neither P00 nor P03 stopped. Missing "NAV purchase windows" is not mentioned by anyone. Public INDmoney reviews contain almost no failed-SIP-debit account (`06_problem_definition.md` §4.1). The engine's `mandate_payment` category mixes US-stock funding, withdrawals and brokerage | **REFRAMED:** the gap is preparedness and explanation (no reminder, reason or next step), not anxiety about NAV, and its link to stopping is unobserved |
| 6 | **T5 External Validation Seeking** (score 0.544): “When platforms fail to provide emotional reassurance during volatile periods, users outsource their investment decisions to social media influencers.” | Reddit/forums as a source 15/35; friends or family 11/35; creators or influencers 3/35; any source other than app or AMC 31/35 | **P00:** does not seek outside reassurance. **Targets:** P01 and P05 went outside (search, forum, colleague, friend); P05 trusted a friend most and said “a creator can say anything”; P04 none | People go outside, but to peers and forums, not influencers; outside advice reassured rather than pushed to stop (P05). The decision was not "outsourced" | **REFRAMED** |
| 7 | **T6 Over-Monitoring Anxiety** (score 0.536): “Checking portfolio daily increases perceived volatility by 10x, accelerating SIP drop-off rates.” | Checks daily or more 10/35; of those 8/10 considered a change vs 15/25 of the rest | **P00:** opens the portfolio "often" and continues. **Targets:** P01 daily for two weeks then weekly, continued; P05 daily early, continued; P04 monthly, continued | The “10x” is a literal string in `stage3_cluster.py`, not computed. No source shows monitoring leading to drop-off | **CHALLENGED** |
| 8 | **T7 Peer Influence Dependency** (score 0.628): “Investors who enter without independent conviction are 3x more likely to abandon their SIP at the first sign of market correction.” | Started on family/friends' or a creator's influence 10/35; of those 7/10 considered a change (vs 16/25) and 5/10 changed (vs 6/25) | **P00:** some influencer influence, continues. **Targets:** P01 (colleague) and P05 (creator videos) entered on influence and continued | “3x” is hard-coded, not computed. The mock survey shows a gap in "changed" but it is constructed data. In every interview, influence at entry did not lead to abandonment | **CHALLENGED** |
| 9 | **T8 Cross-Selling Fatigue** (score 0.664): “Aggressive credit cross-selling makes serious long-term wealth builders question whether the app prioritizes their financial health or commissions.” | Too many promotions or notifications 6/35; "fewer irrelevant promotions" as the top change 2/35 | **P00:** does not recall being distracted by ads or cross-selling. **Targets:** P04 “I scroll past them.”; P01 wants no pushes “when I'm already worried” | No one connects it to trust in the app's motives or to credit products. Annoyance is mild and situational | **REFRAMED:** a context-dependent irritant, not a retention driver here |
| 10 | **T9 Support Resolution Gap** (score 0.557): “When money is in transit, unresponsive automated support turns a minor technical delay into permanent platform churn.” | Difficult to get help 4/35; "reliable support" as the top change 1/35 | **P00:** no support contact described. **Targets:** P02 used the help section; no target contacted support | The scenario (money in transit) was not covered by any interview | **INCONCLUSIVE** |
| 11 | **T10 Hidden Charges & Tax Complexity** (score 0.584): “Investors feel blindsided when post-tax, post-fee returns differ from the gross returns displayed on the main portfolio card.” | The survey instrument has no tax or charges item | **P00:** wants charges and taxes itemised (“like a restaurant bill everything clearly”); the ₹300 was a bank charge. **Targets:** none raised tax; P03 feared a bank charge | One real source; the instrument P00 refers to (mutual funds, equities/IPO, US) is unclear; nothing links it to SIP continuation | **INCONCLUSIVE** |
| 12 | **Ranking:** Information Desert (0.834) and Red Portfolio Panic (0.822) are the top two opportunities | n/a | Six perspectives cannot rank opportunities | Scores come from keyword/rule-based fields for 90.9% of rows and hand-set actionability constants; the interviews put explanation of events (failure, pause) alongside performance information | **INCONCLUSIVE** |

**Verdict tally:** CONFIRMED 1, REFRAMED 4, CHALLENGED 4, INCONCLUSIVE 3.

---

## 3. Separating P00 from the five targets

| Matrix finding | Rests on P00 only | Shared by targets (simulated) |
|:---|:---|:---|
| Information gaps (row 1) | Terminology learned alone | Normal-ness of returns (P01, P05); meaning of a failure (P03) or a pause (P02) |
| Worry without churn (row 2) | Anxious when red, ignores | P01, P05 worry; P04 calm; all continue |
| Payment gap (row 5) | **₹300 charge; no notification recalled; day-before reminder** | P03: notification without a reason or next step |
| Outside help (row 6) | Does not seek reassurance | P01, P05 do; trust peers over creators |
| Cross-sell (row 9) | No irritation | P04 mild; P01 situational |
| Tax / itemised charges (row 11) | **Restaurant-bill itemisation** | Not raised |
| Evidence-backed, voluntary explanations | **Sourced, optional, uncertainty-aware** | "What is normal" (P01, P05), without an AI framing |

Rows resting on P00 alone (₹300 charge, itemisation, AI-explanation preferences) should not be generalised to first-time investors.

---

## 4. Where the engine's text is not data

- The insight sentences are hard-coded in `THEME_DEFINITIONS` (`stage3_cluster.py`), including “10x”, “3x” and “single largest mental drop-off driver”. They were written before the data was analysed and not derived from it.
- Opportunity scores combine keyword matches with hand-set actionability constants.
- The extracted fields feeding the themes are rating-derived for 2,798 of 3,079 rows.
- The engine has no theme for pause/restart or contribution flexibility, and no tax/charges field.

## 5. Insights from primary research the engine did not surface

1. **Contribution size and pay-date alignment** as protective factors (P00; P01, P02, P03, P04).
2. **Cash-flow stops and "pause then forget"** (P02 only; hypothesis).
3. **Explaining a system event** (failure, pause) as a need distinct from explaining performance (P03, P02; P00's failed debit).

## 6. Limitations
- One real interview; five simulated. No verdict is independently validated.
- Mock survey data is constructed and carries no weight.
- Public-signal checks: INDmoney has almost no reviews describing failed SIP debits, which limits triangulation for row 5.
- No interview covers a user who stopped for performance reasons.

## 7. Using these verdicts in the deck
Label any use of rows 1-12 "simulated interviews + one real interview (P00)". Don't present CONFIRMED as validated, and don't use the engine's multipliers or the 54.2% / 73% window.
