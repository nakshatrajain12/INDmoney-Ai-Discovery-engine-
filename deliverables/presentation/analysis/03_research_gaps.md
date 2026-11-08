# 03 Research Gaps, Claim Register and Remediation Plan

Companion to `01_evidence_audit.md` (provenance) and `02_survey_analysis.md` (recalculated numbers). This document answers: what is missing, which claims the project can and can't make today, and what real research would close the gaps.

---

## 1. What exists vs what the case study needs

| Needed for the deck | Status today | Evidence |
|:---|:---|:---|
| Genuine survey of first-time SIP investors (target 40-60, minimum ~30) | **Missing.** 0 evidenced genuine responses | `01` §2 |
| Raw survey export with timestamps / form metadata | **Missing.** Only a "clean, anonymized" file with no timestamps | Pack §12 expects `survey_raw_export.csv` |
| Variable for **when** someone paused/stopped | **Missing from the instrument** | `02` §2 |
| Five target-user interviews (P01-P05) | **Missing.** `actual_interviews/` is empty; the pack lists them as pending | `01` §4 |
| Candidate selection log and consent records | **Missing** | Pack §6.3 |
| Interview opt-in contact file (kept separate) | **Missing.** Opt-ins are flagged on class B/C rows only | `02` §3.4 |
| Researcher-user interview (P00) | **Exists** (pack §16), with open probes (§16.8) | Single, non-independent |
| Public-signal evidence (engine, 3,079 rows) | **Exists, but weak** for SIP retention (see §2) | `segment_analysis.md` §1 |
| Product analytics (debit success, pause/cancel events, cohort retention) | **Not available** in the repo | Pack §10.3 |
| Usability tests / prototype results | **Not run** | Pack §11 |

---

## 2. Gaps in the evidence the project already has

### 2.1 Discovery-engine data (from the earlier segment analysis)
- 90.9% of the 3,079 extracted rows are rule-based fallbacks; emotion, action, severity and experience are derived from the star rating.
- Age, income, influence source and tenure are 92-99% unknown.
- Only 41.7% of "relevant" rows mention SIP or mutual funds; INDmoney + SIP-explicit rows number 271.
- The golden-set accuracy (95.4%) uses 20 IDs, none of which exist in the extracted corpus.
- The "54.2% / 73% in months 3-6" figure could not be reproduced: only 68 rows carry any tenure value and 6 are `months_3_6`.
- `reddit_posts.jsonl` is empty, so Reddit content the synthesized rows cite is not in the engine.

### 2.2 Constructed survey and interview files
- Provenance: class B (5) and class C (30); no class A.
- Interview matrix P01-P05 are review-derived profiles; workbook P00 contradicts the real P00.
- The workbook relabels a start-period question as "Tenure" / "Core Drop-off Window."

### 2.3 P00 (the only primary evidence)
Open items recorded in pack §16.8, not yet resolved:
- Age at interview; whether the SIP was the first-ever mutual-fund investment; current SIP status; start month/year.
- Exact checking frequency ("often").
- The ₹300 charge is participant-reported: fee type, charging party and notification logs are unverified.
- Whether the requested STCG/brokerage/tax breakdown refers to mutual funds, equities/IPO, US securities or a consolidated view.
- Participant approval is needed before quoting any phrase on a slide.
- Survivor bias: P00 is a continuer.

---

## 3. Claim register: what the project may and may not say

| # | Claim in current materials | Where | Evidence status | Allowed? |
|:--|:---|:---|:---|:---:|
| 1 | "73% of first-time SIP drop-offs occur in months 3-6" / "54.2% ... concentrate here" | `docs/deck_slide_spec.md`, `docs/competitor_analysis.md:39` | Not reproducible from engine data (6 of 68 tenure-tagged rows; 3,079 total) | **No** |
| 2 | "95.4% benchmark precision" | deck spec, evidence log | Measured on 20 items not in this corpus; 90.9% of rows are rule-based | **No**, unless rescoped to the 20-item set only |
| 3 | "Information Desert is the #1 blocker" (score 0.834) | deck spec | Theme assignment relies on fields that are rating-derived for most rows | **Not as stated**; label "engine hypothesis" |
| 4 | "N = 35 eligible respondents" | workbook title | 0 evidenced genuine respondents | **No** |
| 5 | "45.7% in the core drop-off window (3-6 months)" | workbook row 10 | Start-period share, not churn timing | **No** |
| 6 | "76.7% of first-time investors considered or paused/stopped" | workbook row 16 | Descriptive of a constructed set | **No** |
| 7 | "25.7% experienced payment failures; clarity 1.89/5" | workbook rows 24-25 | Same | **No** |
| 8 | "Five user interviews" | pack plan, workbook matrix | None conducted; P01-P05 are review-derived | **No** |
| 9 | Quotes attributed to P01-P05 | workbook matrix | Public-review-derived, unverified | **No**, unless shown as "public Reddit post (paraphrased)" |
| 10 | P00 as an interview | pack §16 | Real, n = 1 | **Yes**, labelled "researcher-user; not independent" |
| 11 | "P00 felt anxious when red but continued; the frustration came from an unexplained failed debit and penalty" | pack §16.9 | Real, n = 1 | **Yes**, as one participant's account, with quote approval |
| 12 | Public reviews show support/reliability/returns-clarity complaints among unhappy INDmoney app reviewers | `segment_analysis.md` | Keyword-based, public reviews, correlation only | **Yes**, as public-signal evidence with caveats |

**Rule of thumb for slides:** a claim needs a traceable source of the right tier (§4). Percentages need a real denominator.

---

## 4. Evidence tiers to label on slides

| Tier | Source | Can support | Cannot support |
|:---|:---|:---|:---|
| T1 | Verified product analytics (not available) | Observed behaviour, cohort retention | Motives |
| T2 | Genuine survey (not available) | Self-reported frequency in a convenience sample | Population prevalence, causation |
| T3 | Real interviews (only P00) | Mechanisms, sequences, language | Prevalence |
| T4 | Public reviews/forums (engine corpus) | Themes, wording, pain points | Prevalence, SIP status, causation |
| T5 | Constructed/synthesized records | Nothing (illustration only, labelled) | Anything evidential |

Current position: **T3 (n = 1) and T4 only.**

---

## 5. Contradictions to resolve before synthesis

| # | Tension | Why it matters |
|:--|:---|:---|
| 1 | Red-portfolio anxiety vs churn: P00 is anxious but never considers stopping; the engine theme "Red Portfolio Panic" presumes it converts to drop-off | Don't equate worry with churn |
| 2 | Cross-selling: P00 reports no irritation; workbook P00 and several synthesized rows describe it as a core friction; public reviews in the engine mention nagging | Don't treat as universal; segment it |
| 3 | External validation: P00 doesn't seek outside reassurance; the constructed set shows Reddit use at 42.9% | The constructed figure comes from rows derived from Reddit threads |
| 4 | Payment friction: P00 and the constructed set agree on poor failure communication; neither can estimate prevalence | A consistent theme is not a measured rate |
| 5 | Months 3-6: the pack, workbook and deck all lean on it; nothing verified supports a window | Risk of confirmation bias |
| 6 | Platform migration (R02) coded as stopped, moved and active | Need a clear churn definition |

---

## 6. Remediation plan (minimum viable real research)

### 6.1 Fix the survey instrument before fielding
1. **Add churn-timing questions:** "How many months after starting did you first pause/reduce/stop?" and a month/year for SIP start (replace banded Q5, or add alongside).
2. **Separate outcome definitions:** paused, reduced, stopped, migrated platform, completed. Don't pool "reduced" and "moved platform" into churn.
3. Remove the overlap between Q3 and Q7 so that status is asked once.
4. Add an optional "was the SIP debit ever unsuccessful in the last 3 months?" with date, to allow timing of payment events.
5. Keep time-stamped raw export (restricted) and a de-identified copy; record channel of recruitment.
6. Let respondents choose their own participant code, as Q25 intends.

### 6.2 Collect real data
| Item | Target | Notes |
|:---|:---|:---|
| Survey responses | 40-60 eligible; ~30 absolute minimum | Report actual N; INDmoney SIP users first; flag subgroups under 5 |
| Interviews P01-P05 | 5 (6th reserve) | Select from real volunteers using the pack's §6 rubric; fill any perspective gaps honestly (report "none found" instead of constructing) |
| P00 follow-up | 1 short session | Resolve §2.3 open items; get quote approval |
| Selection log, consent records | Required | Pack §6.3 |

### 6.3 Handle the existing files
1. Keep them, but rename or label as **illustrative/pilot synthetic data** (e.g., prefix `SYNTHETIC_`). I haven't renamed anything.
2. Correct the workbook P00 row from pack §16 or delete the row.
3. Remove or fix the "Eligible Respondents" and "Core Drop-off Window" labels.
4. Don't merge the constructed rows with future real responses.

### 6.4 If real research cannot be completed in time
The deck can still be honest. Suggested framing:
- Present the problem as an **evidence-led hypothesis** based on T3 (P00) and T4 (public reviews/forums), with explicit "validation pending."
- Replace headline percentages with counts and denominators tied to named sources, or with no percentages.
- Show the research plan and the specific tests (survey fields, interview slots) as the validation roadmap.
- Use the engine's mandate/payment and support/reliability findings only as public-signal themes.
- Do not present any T5 figure or persona as user research.

### 6.5 Re-run analysis when real data arrives
- `02_survey_analysis.md` can be reused as a template once Q5/outcome definitions are fixed.
- Re-run the segment analysis after re-extracting the 2,798 fallback rows with an LLM (see `segment_analysis.md` §7).

---

## 7. Open questions for the project owner

1. Were any of the 35 CSV rows collected from real people? If so, which, and is there a raw export?
2. Who produced the workbook (its `Interview_Coding_Matrix` and P00 row), and from what inputs?
3. Is the intended segment still "first-time investors in months 3-6," given that the evidence for that window doesn't hold up?
4. Will P00 approve quote use, and can the open probes be answered?
5. Is there any INDmoney analytics access (even aggregate pause/failed-debit rates) that could supply T1 evidence?
