# Research Context: Single Source of Truth

**Scope:** first-year SIP experience of first-time mutual fund investors: early expectations, confidence, payment continuity, information-seeking and affordability.
**Research cut-off:** 6 November 2026. **Document built:** 2026-11-08.

**Sources read in full:** `survey_clean_anonymized.csv`, `survey_frequency_tables.csv`, `survey_multiselect_long.csv`, `cohort_3_to_6_months.csv`, `UPDATED_SURVEY_WORKBOOK_N26.xlsx` (identical to the other workbook copy), `INTERVIEW_RECORDS_P01_P05.md`, `interview_findings_P00_P05.csv`, `hypothesis_validation_register_16.csv`, `supporting_evidence_ledger.csv`, `FINAL_SIP_RESEARCH_REPORT.md`, `SOURCE_RESEARCH_REPORT.md`, and the AI Discovery Engine repository (`data/raw`, `filtered`, `extracted`, `themes`, `eval`, `pipeline/`) plus its live home page.

**Rules for using this document**
1. All survey figures are **N=26** (all platforms) unless a different base is stated. Where a figure differs from an older N=20 figure or from another document, the CSV is authoritative.
2. The survey and interviews are small, non-probability and mixed-platform. **Nothing here is INDmoney customer prevalence.**
3. AI-engine percentages are shares of a public-review corpus. **They are not prevalence, churn or timing.**
4. **P00 is not independent research evidence.** It is the researcher-user's own account (see §3).
5. Labels: **[F]** fact (measured), **[I]** interpretation, **[H]** hypothesis, **[A]** assumption.

---

## 1. Research methodology

| Component | What was done | Base |
|---|---|---|
| Survey | Self-completed online questionnaire "Understanding the First-Year SIP Experience". Eligibility: consent, age 18+, personally started a mutual fund SIP. 27 submissions; one ("Never started") is outside the target population; **N=26 accepted** (R01–R26). Names and contact details removed; timestamps removed. | N=26 |
| Interviews | Six cases P00–P05. P01–P05 are condensed interview records with behavioural timelines. P00 is the researcher-user's own account. | 6 cases (5 + 1 contextual) |
| AI Discovery Engine | Scraped 8,179 public posts (Google Play, App Store, YouTube comments, TradingQ&A, ValuePickr); filtered to 3,079 clean signals; LLM-tagged on 7 dimensions; assigned to 10 pre-defined themes; scored by an Opportunity Score. | 3,079 signals |
| Hypothesis register | 16 items: 3 research hypotheses (H1–H3), 3 product hypotheses (P-H1–P-H3), 10 engine themes (T1–T10), each checked against survey and interviews. | 16 |

**Segmentation method.** Rule-based archetypes from survey fields. No statistical clustering, because n is far too small.

**Definitions used**
- *Confused about returns* = selected "Unsure if returns were normal" **or** "Confusing performance terms" in the multi-select issues question.
- *Considered a change* = "Yes, but continued" or "Yes, and did". *Changed course* = "Yes, and did".
- *First-time investor* = "First mutual fund investment: Yes". *First year* = SIP tenure of 12 months or less (1–3, 3–6 or 6–12 months).
- *Payment issue* = dedicated question answered "Yes, once" or "Yes, more than once". The separate issue-checklist item "Auto-debit or mandate failure" is a **different measure** and is never combined with it.

---

## 2. Survey findings (N=26)

### 2.1 Sample
| Platform or channel | n | | SIP tenure | n | | Status | n |
|---|---|---|---|---|---|---|---|
| INDmoney | 11 | | 1–3 months | 1 | | Active, regular debits | 19 |
| Groww | 8 | | 3–6 months | 7 | | Active, failed or missed debits | 1 |
| Bank or financial institution | 3 | | 6–12 months | 7 | | Paused | 3 |
| Other | 2 | | 12–24 months | 3 | | Stopped or cancelled | 2 |
| Zerodha Coin | 1 | | More than 2 years | 7 | | Completed tenure | 1 |
| Adviser or distributor | 1 | | Don't remember | 1 | | | |

First mutual fund investment: Yes 20, No (invested before) 5, Not sure 1. Occupation: salaried 12, student 10, self-employed 2, homemaker 1, freelancer 1. Status is self-reported and not checked against account records.

### 2.2 Expectations and behaviour
- **[F]** 12/26 expected quick positive returns in the first 6–12 months; 12/26 expected to build a habit; 9/26 expected fluctuations but comfort continuing.
- **[F]** Considered pausing, reducing or stopping: **17/26** (11 considered and continued, 6 did); 9/26 did not. Actually changed course: **6/26**.
- **[F]** First action when returns are flat or negative: continue as usual **12**, YouTube 4, family or friends 2, Google or articles 2, in-app explanation 2, adviser 1, Reddit or forums 1, never experienced 1, consider pausing or stopping 1.
- **[F]** Checking frequency: monthly 7, daily 5, rarely or never 4, few times a week 3, few times a month 3, weekly 3, multiple times a day 1 (daily or more: 6).
- **[F]** Main reason for considering a change (single choice, includes "prefer not to say" and "other"): confusing or disappointing returns 7, prefer not to say 5, income or cash-flow drop 3, external advice 2, unclear time horizon 2, lost app confidence 2, other 2, auto-debit issue 2, unexpected expense 1.
- **[F]** Basis for the first SIP amount: monthly affordability **15**, advice from others 4, linked to a goal 3, suggested amount 2, minimum entry amount 2.

### 2.3 Performance understanding and confidence
- **[F]** Unsure whether returns were normal **11/26**; confusing performance terms **11/26**; both 9; either **13/26**.
- **[F]** Confidence understanding SIP metrics (1–5): 1 = 3, 2 = 6, 3 = 7, 4 = 6, 5 = 4. Rated 1–3: **16/26**.
- **[F]** Metrics people check: current value 17, profit and loss % 13, invested vs current 12, XIRR 6, AutoPay status 6, upcoming SIP date 5, goal progress 4, individual funds 2, market news 1.

### 2.4 Payment and mandate friction
- **[F]** Dedicated question: No 14, Yes once 6, Yes more than once 5, Not sure 1 → **11/26** with an issue.
- **[F]** Separate checklist: auto-debit or mandate failure **5/26**; unclear failure reason 4/26. *Do not add to the 11.*
- **[F]** Clarity of reason and next steps (1–5), among the 11 with an issue: 1 = 3, 2 = 1, 3 = 3, 4 = 2, 5 = 2; **4/11** rated 1–2; mean 2.9.
- **[F]** Among the 11 with an issue: considered a change **8/11**, changed **4/11**. Among the 14 answering "No": considered **8/14**, changed **1/14**. Fisher exact (descriptive only): considered p≈0.68, changed p≈0.13.

### 2.5 External help and information-seeking
- **[F]** Help sources selected (multi-select, overlapping): friends or family 11, Google 10, investment app 8, YouTube 7, Reddit or forums 7, financial adviser 6, influencers 4, AMC website 3, don't seek information 2. At least one source: **25/26** (R20 ticked "don't seek" and other sources; R25 only "don't seek").
- **[F]** "Investment app" is a source, so 25/26 is not "outside the app".

### 2.6 Single most valuable improvement (single choice)
Clearer return or volatility explanations **9**, clear payment-failure recovery 4, better upcoming-debit visibility 3, simple goal tracker 3, easier pause or edit controls 3, faster support 2, no help needed 2.

### 2.7 3–6-month cohort (n=7)
7/7 expected quick positive returns; 6/7 seriously considered a change; 2/7 changed course; 5/7 named confusing or disappointing returns as the main reason; 7/7 selected "unsure" or "confusing terms"; 7/7 rated confidence 1–3. Platform: 4 Groww, 3 INDmoney. Contrast, 6–12 months (n=7): 2 confused, 0 expected quick returns, 4 considered, 1 changed. **[F]** at n=7 this is hypothesis-generating, not a "cliff".

### 2.8 Who changed course (6/26)
| Resp. | Platform | Tenure | First MF | Confused | Payment issue | Main reason | Status |
|---|---|---|---|---|---|---|---|
| R04 | Other | >2 yr | Yes | Yes | Yes (more than once) | Confusing/disappointing returns | Paused |
| R05 | Bank | >2 yr | Yes | Yes | No | Unclear time horizon | Active |
| R11 | INDmoney | >2 yr | Not sure | Yes | Yes (once) | Confusing/disappointing returns | Stopped |
| R18 | INDmoney | 3–6 mo | Yes | Yes | Yes (once) | Confusing/disappointing returns | Stopped |
| R19 | Groww | 3–6 mo | Yes | Yes | Yes (more than once) | Lost app confidence | Paused |
| R23 | INDmoney | 6–12 mo | Yes | No | Not sure | Income or cash-flow drop | Paused |

5 of 6 were confused; 4 of 6 reported a payment issue; 1 of 6 named cash flow; 2 of 6 are more than 2 years into their SIP, so are not first-year cases.

### 2.9 Sensitivity: what N=26 includes
Five rows (R22–R26) are near-verbatim retellings of interviews P01–P05, and one respondent's consent was changed from No to Yes in the workbook (see §8–9). Results should be read with this view:

| Measure | N=26 | N=21 (R01–R21) | INDmoney only (n=11) |
|---|---|---|---|
| Confused (either) | 13 | 11 | 5 |
| Confidence 1–3 | 16 | 12 | 8 |
| Payment issue | 11 | 10 | 5 |
| Considered / changed | 17 / 6 | 13 / 5 | 8 / 3 |
| Expected quick returns | 12 | 10 | 6 |
| Continue as usual when flat or red | 12 | 9 | 5 |
| Want clearer return explanations | 9 | 7 | 4 |
| 3–6-month cohort n | 7 | 5 | 3 |

---

## 3. Interview findings

**Independence rule.** P01–P05 are the interview evidence. **P00 is not independent.** It is the researcher-user's own first-person account, not part of survey N=26, and is used only as **context** and a source of questions. It is never counted in tallies of "cases supporting" a finding.

| ID | Platform | Tenure | Case | Key facts [F] | Alternative explanation recorded |
|---|---|---|---|---|---|
| P01 | INDmoney | ~5 mo | First-time; expected visible growth by month 3 | ₹2,500 a month; slightly negative return; did not understand XIRR; Googled, found conflicting answers; colleague said it's early; considered pausing, continued; checks weekly | Continued partly because only ~₹12,500 was invested, so the rupee loss was small |
| P02 | INDmoney | ~9 mo | First-time; paused | ₹5,000 a month, variable freelance income; paused ~month 7; unsure how pause differs from cancel or reduce; worried the mandate stays active; meant a one-month pause, no restart three months later; no restart reminder | Affordability and no emergency buffer, not returns; starting amount may have been too high |
| P03 | INDmoney | ~3 mo | First-time; failed debit | ₹1,500 a month via UPI autopay; daily UPI limit caused failure; notice said "failed" with no reason; checked bank app, retried manually; unsure whether SIP was cancelled or only that month; continued | No penalty occurred and the amount was low |
| P04 | INDmoney | ~10 mo | First-time; continuer (**disconfirming**) | ₹4,000 a month for a house deposit goal; salary-aligned date; monthly checks; no outside help during a dip; mild annoyance at cross-sell prompts | May be a continuer through traits (buffer, goal) no feature creates |
| P05 | **Groww** (comparison) | ~5 mo | First-time; expectation mismatch | Creator videos set high expectations; sideways to negative returns; conflicting advice online; forum explanation and a friend reassured; kept the SIP and checked less | Outside sources both created and resolved the doubt |
| P00 | INDmoney, researcher-user | ~3 yr; SIPs ~2 yr | **Contextual only** | ₹500 across 3 SIPs, later ₹850; anxious when red but continued; one failed debit (insufficient funds), no advance notice recalled; reported ₹300 penalty **(unverified)**; wants a day-before reminder | Positional: the researcher is also the participant |

**Cross-interview synthesis (P01–P05 only)**
- Return interpretation: P01 and P05 (P05 not INDmoney); counterexample P04.
- Payment communication: P03; adjacent control confusion P02.
- Pause and restart: P02; the only interviewed participant who actually stopped.
- External information: P01 and P05; it both confused and reassured; no causal effect on retention shown.
- Cross-sell annoyance: mild in P01 (as an unwanted prompt) and P04; not shown to be a SIP problem.

**Fit to the selected segment.** Only P01 (INDmoney) and P05 (Groww, comparison) fall in "Uncertain Newcomers". P02, P03 and P04 are adjacent or disconfirming cases. The records are labelled "condensed", and each has a designed sampling reason and a hypothesis tested, so they should be described as hypothesis-driven condensed notes.

---

## 4. Selected user segment

**Uncertain Newcomers**: a rule-based archetype, not a statistical cluster.
- **Rule [F]:** first MF investment, SIP tenure 12 months or less, and unsure about returns or confused by terms.
- **Size [F]:** **9/26** (9 of the 14 first-time investors in their first year; 20 first-time investors in all).
- **Composition [F]:** INDmoney 4 (R15, R16, R18, R22), Groww 5 (R08, R12, R19, R20, R26).
- **Behaviour [F]:** 7/9 expected quick positive returns; **8/9** rated confidence 1–3; 7/9 in months 3–6 (2 in months 6–12); 4/9 check daily or more; 8/9 considered a change; **2/9** changed (R18 INDmoney stopped, R19 Groww paused); 3/9 had a payment issue (R18, R19, R20), including both who changed; 6/9 chose clearer return explanations as the most valuable change.
- **INDmoney-only view [F]:** n=4, all four rated confidence 1–3 and considered a change, 1 changed, 1 had a payment issue.
- **Need [I]:** "Is this normal for my stage?"; evidence in P01 and P05.
- **Confidence:** medium that the need exists; **low** that it explains churn (see §8).

**Other groups the selected scope serves**
- *Debit-disrupted:* 11/26 with a payment issue (INDmoney 5). Interviews: P03, adjacent P02.
- *Cash-flow-constrained:* 4/26 named income drop or unexpected expense; 15/26 sized by affordability; 3/26 chose easier pause or edit controls; 1 of the 6 who changed course. Interview: P02.
- *Goal-anchored continuers (guardrail population):* 9/26 never considered a change; 12/26 continue as usual when returns are flat or red. Interview: P04.
These groups overlap and are not mutually exclusive (e.g., 5 of the 13 confused respondents also reported a payment issue).

---

## 5. Validated hypotheses

"Validated" here means **supported as narrowly framed in this sample**. It never means causal or population-level. Verdict wording follows `hypothesis_validation_register_16.csv`, with N=26 figures.

| ID | Hypothesis | Evidence [F] | Limit |
|---|---|---|---|
| T3 | **Information Desert**: investors lack understandable explanations of SIP performance | 11/26 confusing terms; 11/26 unsure; 16/26 confidence 1–3; 9/26 want clearer explanations; P01, P05 examples | Self-reported; mixed platform; P04 counterexample; engine score 0.834 is not prevalence |
| T4 | **Mandate & Payment Friction** (problem level) | 11/26 on the dedicated item; 4 of 11 rated clarity 1–2; P03 | Causal impact on interruption unproven; keep apart from the 5/26 checklist |
| H1 | **3–6 month expectation gap** (narrow subgroup) | n=7: 7/7 expected quick returns, 6/7 considered, 2/7 changed, 5/7 named confusing returns | n=7; includes R22 and R26 (mirror rows); no causal inference |
| T2 | **Expectation vs Reality Gap** (narrow form) | 12/26 expected quick returns; 7/7 in the 3–6-month cohort | Overlaps H1; treat as one problem family |

---

## 6. Partially validated hypotheses

| ID | Hypothesis | Register verdict | Evidence [F] | What is missing |
|---|---|---|---|---|
| H2 | Payment friction contributes to avoidable interruption | Reframed and supported | 11/26; considered 8/11 vs 8/14; changed 4/11 vs 1/14 | Causality; the gap is descriptive (p≈0.13) |
| H3 | External validation and conflicting advice trigger pauses | Reframed and supported | 25/26 used a source; 4/26 chose YouTube first; 2/26 named external advice as main reason; P01, P05 | Outside help also reassured P05; no causal link |
| P-H1 | Flexible controls (skip, step-down, pause with return date) keep SIPs alive | Reframed and supported, problem level | P02; 3/26 chose easier pause or edit; 4/26 cash-flow reason; 1 of 6 changers | Feature demand and lift untested |
| P-H2 | Failure recovery (reason, next step, retry) | Reframed and supported, problem level | 11/26 issue; 4/26 chose recovery, 3/26 debit visibility; P03 | One-tap recovery efficacy untested |
| P-H3 | Self-sized amount | Partially validated | 15/26 sized by affordability; P02, P00 | Broad need for automated sizing not shown |
| T1 | Red Portfolio Panic | Partially validated | Anxiety in P01, P05 (P00 context); 7/26 named confusing returns as main reason | 12/26 continue as usual; 1/26 pauses first; P04 calm |
| T5 | External Validation Seeking | Reframed and supported | 25/26 | Help-seeking is not dependence |
| T6 | Over-Monitoring Anxiety | Partially validated | 6/26 check daily or more | No link from checking to anxiety or churn |
| T7 | Peer Influence Dependency | Reframed and supported | 7/26 family or friend referral; 11/26 friends as a help source | "Dependency" too strong |

---

## 7. Unvalidated hypotheses

"Not validated" means **insufficient evidence here, not proof the problem is absent.**

| ID | Hypothesis | Why unvalidated |
|---|---|---|
| T8 | Cross-Selling Fatigue | No survey measure; mild annoyance in P01 and P04 only; engine example records include unrelated payments and rewards |
| T9 | Support Resolution Gap | 1/26 poor app support, 2/26 faster support; interviews do not show failed support resolution |
| T10 | Hidden Charges & Tax Complexity | No survey measure; the only signal is P00 (contextual, ₹300 unverified) |
| Untested interventions | That Return Coach, Debit Explainer or Pause and Restart improve retention | No intervention has been tested |
| Untested design claims | Hinglish or free-text benefit; that "typical at this stage" can be shown without being read as advice | Not examined |

---

## 8. Contradictory and disconfirming evidence

1. **Confusion does not clearly separate who changes course.** First-time investors: confused 4/12 changed vs not confused 1/8 (p≈0.60). First-year first-timers: **2/9 vs 1/5**. All respondents: 5/13 vs 1/13 (p≈0.16). 2 of the 6 who changed are more than 2 years in.
2. **Considering is not changing.** 17/26 considered; 6/26 did.
3. **Payment link is mixed.** Considered a change is the same with or without an issue (8/11 vs 8/14), while changing course differs (4/11 vs 1/14).
4. **Cash flow, not returns, was the one interviewed stopper.** P02; and R23, the only first-year first-timer who changed without being confused.
5. **Counter-cases to "everyone needs reassurance".** P04 (calm, no outside help); 9/26 never considered a change; 12/26 continue as usual; R08 and R12 (3–6 months, confused) did not change.
6. **P01 stayed partly because the rupee loss was small**, so understanding may not be what kept them.
7. **Outside help can retain.** P05 stayed after a forum explanation and a friend's reassurance.
8. **Engine versus survey on panic.** The Red Portfolio Panic theme ranks second by engine score, yet 12/26 continue as usual; only 0.6% of its signals record a pause or cancel.
9. **Platform mix.** The selected segment is 5 Groww to 4 INDmoney; P05 is the closest interview match and is not an INDmoney user.
10. **Source inconsistencies to avoid repeating.**
    - `FINAL_SIP_RESEARCH_REPORT.md` §3 says "9/26 continue as usual". The CSV gives **12/26**, and the register's T1 row also says 12. 9 is the older N=20 figure.
    - The README, final report and Evidence Log mention Reddit as an engine source. The corpus contains **no Reddit rows**.
    - `data/export/` in the engine repository describes a "constructed mock academic survey dataset (N=35)". It conflicts with this research and is **not** a source.

---

## 9. Research limitations

**Sample and design**
- N=26, non-probability, self-reported, mixed-platform (INDmoney 11). Percentages describe this sample only. Cells are tiny (the segment is 9; the cohort 7), so differences are descriptive.
- **Independence.** Rows R22–R26 (timestamped 6 Nov, ~00:21–00:33) retell P01–P05 almost verbatim: R22 = P01, R23 = P02, R24 = P03, R25 = P04, R26 = P05. So at N=26 the interview cases are partly counted twice, and R22 and R26 are two of the seven in the 3–6-month cohort. Whether these rows are real, simulated or adapted cannot be established from the files.
- **Consent.** One respondent's consent was recorded as No in an earlier workbook and Yes in the updated one; no re-consent record is in the pack.
- **Platform field.** The platform of three rows was edited between workbook versions; who changed it and why is undocumented. INDmoney counts depend on this.
- The final report omits these caveats, which the source report states. They must be disclosed wherever N=26 is used.
- Multi-select counts overlap. The dedicated payment question and the issue checklist are different measures. Considering a change is not stopping.
- "Confused" is built from a multi-select checklist, not a validated scale.

**Interviews**
- P01–P05 are condensed notes with designed sampling reasons; whether each is a verbatim recruited interview or adapted cannot be determined here and must be stated honestly in the deck.
- Only P01 (and P05, a Groww user) belong to the selected segment; the brief calls for 5–6 interviews in the chosen segment.
- P00 is positional and not independent.

**AI Discovery Engine (discovery only)**
- **Corpus:** 8,179 raw posts → 3,079 clean signals; by product, **INDmoney 1,114 (36.2%)**, Zerodha Coin 789, Groww 473, general threads ~703. Not first-year-specific and not restricted to INDmoney users.
- **Tenure:** 3,011 of 3,079 signals (97.8%) have unknown SIP tenure; 68 carry any tenure; 6 are tagged months 3–6. **The engine cannot say when SIPs break.** The "18.4 / 54.2 / 21.6 / 5.8%" lifecycle windows shown in the app are typed constants, not computed from data, and must not be used.
- **Themes** are pre-defined and signals are assigned by an affinity score with substring keyword matching (e.g., 943 of 3,079 items match a Red-Portfolio keyword as a substring, 306 as whole words).
- **Opportunity Score** (0.30 frequency + 0.30 severity + 0.25 actionability + 0.15 recency): actionability is hand-set; severity barely varies (0.66–0.74); recency is 0.65 for every theme (fallback value), so the ranking is essentially frequency plus hand-set actionability. Scores and corpus shares are not prevalence, churn or validation.
- **Golden set:** the 20 "engine" labels are hard-coded in `evaluate_golden_set.py` and none of the 20 items is in the corpus (4 are labelled Reddit). The reported 95.4% accuracy is not evidence about the pipeline.
- **Quotes:** representative quotes are weakly related to some themes (e.g., a brokerage-charges quote represents payment friction).
- **Signals of action:** 0.84% of signals record a cancel, pause or switch.
- Not checked: the Copilot (`/ask`).

**External statistics**
- Industry figures (stoppage ratio, 5-year holding) are industry-wide; INDmoney retention is unknown.

---

## 10. Product implications

Implications are **recommendations [I/H]**, not findings.

1. **Return Coach first.** Return confusion has the strongest direct support (T3; 9/26 most valuable change). Explain the user's own figure at their SIP stage in plain, cited, descriptive language. No advice, no predictions, no urgency.
2. **Rules-based Debit Explainer.** Payment friction is real (11/26), and the clarity ratings are low (mean 2.9 among those affected). Show reason, SIP status and next step from a rules table. It does not need an LLM; test it as a non-AI feature.
3. **Pause and Restart controls.** Cash flow was the one fully documented actual stop (P02) and 1 of the 6 who changed course; explain pause, reduce and cancel, offer pause with a return date, and use an **opt-in** restart reminder.
4. **Don't over-nudge.** P04, the 9/26 who never considered a change, and "Don't make me do things to keep my SIP going" argue for quiet defaults; use confident continuers as the guardrail population.
5. **Use AI only where it earns its place** (messy input, the user's own numbers, free text), gated by an eval on a new golden set; keep rules in charge of facts. This is an assumption to test.
6. **Measure before claiming.** Instrument the retention stages from INDmoney data; run experiments with holdouts; judge success on continuation and comprehension, not clicks.
7. **Close evidence gaps before scaling:** interviews with INDmoney first-year investors who have seen a flat or red figure; clarify R22–R26 provenance; a compliance read of "typical at this stage" wording; INDmoney-only analysis of the 3–6-month pattern.
8. **Deprioritise** cross-sell cleanup, support-resolution and tax or charges explanation until independent evidence appears.
9. **Reporting language.** Use: "in this sample", "descriptive", "mixed-platform", "problem-level support". Avoid: "INDmoney customers", "prevalence", "churn cliff", "caused", "proven", "validated" for any intervention.
