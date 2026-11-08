# 02 Survey Analysis: Recalculation and Verified Numbers

> **READ FIRST.** Per `01_evidence_audit.md`, the CSV contains **0 evidenced genuine survey respondents**: 5 forum-derived rows (class B) and 30 synthesized rows (class C). Every number below is a **descriptive count of that constructed dataset**. None is a finding about SIP investors, INDmoney users or any population, and none should appear on a slide as a survey result. The value of this document is (1) confirming whether the workbook's arithmetic is right, (2) showing which definitions would mislead if reused, and (3) fixing the analysis template for when real responses arrive.

**Method:** every figure was recomputed from `survey_clean_anonymized.csv` (35 rows, standard-library Python). The workbook's `Quantitative_Analysis` sheet was used only as a list of claims to check. Denominators are shown as n/N. Multi-select percentages can exceed 100%.

---

## 1. Verification of the workbook's 28 claims

All 28 count/denominator pairs on `Quantitative_Analysis` **match the raw CSV**. The problems are in labels and definitions, not arithmetic.

| Row | Workbook claim | Recomputed | Arithmetic | Issue |
|:--|:---|:---|:---:|:---|
| 3 | Total eligible respondents 35/35 | 35 rows | OK | "Respondents" is wrong: provenance is B/C (see 01) |
| 4-5 | First-time 30/35 (85.7%); experienced 5/35 (14.3%) | 30 / 5 | OK | Experienced base = 5, at the edge of the pack's small-base rule (flag < 5) |
| 6-7 | INDmoney 27/35 (77.1%); others 8/35 (22.9%) | 27 / 8 (Groww 4, Zerodha Coin 2, AMC 1, Bank 1) | OK | The 8 "others" are too small to compare |
| 8-12 | "Tenure" bands 1 / 5 / 16 / 8 / 5 | 1 / 5 / 16 / 8 / 5 (12-24 mo 4 + >2 yr 1) | OK | **Q5 is the SIP *start period*, not tenure or churn timing** (see §2) |
| 10 | 3-6 months "[Core Drop-off Window]" 16/35 (45.7%) | 16/35 (45.7%) | OK | **Mislabel.** 45.7% of rows *started* 3-6 months ago. It says nothing about when anyone dropped off. |
| 13-15 | Considered stopping: continued 12; paused/reduced/stopped 11; no 12 | 12 / 11 / 12 | OK | Row 14's "paused/reduced/stopped" includes 2 who only *reduced* (still active) and 1 who *moved platform* (still active) |
| 16 | First-time who considered/did change 23/30 (76.7%) | 23/30 | OK | Combines "considered and continued" (12) with "did change" (11) |
| 17 | Experienced who considered/did 0/5 (0.0%) | 0/5 | OK | n = 5; cannot support "experienced investors don't stop" |
| 18-23 | Reasons among 23: 8 / 6 / 3 / 2 / 2 / 2 | 8 / 6 / 3 / 2 / 2 / 2 | OK | Row label "Reason for change" is misleading: 12 of the 23 *did not* change. Rows 20 and 23 each merge two instrument options (cash flow + unexpected expense; change amount/timing + others' advice). |
| 24 | Payment/mandate failure 9/35 (25.7%) | 7 once + 2 more than once = 9 | OK | Not split by platform, outcome or recovery |
| 25 | Mean failure clarity 1.89 (n = 9) | (3×1 + 4×2 + 2×3)/9 = 17/9 = 1.89 | OK | Distribution is 1 (n=3), 2 (n=4), 3 (n=2); none above 3. n = 9 is very small |
| 26-30 | Requested change: 11 / 6 / 5 / 4 / 4 of 35 | 11 / 6 / 5 / 4 / 4 | OK | Omits 3 options (promotions 2, "no help needed" 2, support 1): the five rows cover 30 of 35 answers |

**Cross-sheet integrity:** `Survey_Clean_35` equals the CSV cell for cell (formatting aside). No formulas exist in the workbook.

---

## 2. SIP start period is not churn timing

This is the most important definitional issue.

- **Q5** asks: "Approximately when did you start your first mutual-fund SIP?" It records **when the SIP began**.
- **No question in the instrument asks when someone paused, reduced or stopped.** The CSV has no time-of-change column.
- The workbook relabels Q5 as "Tenure" and calls the 3-6 months band the "Core Drop-off Window." That asserts a result the data cannot show, and it echoes the engine claim in the pack (§6.1 "54.2% ... in this window"), which I could not reproduce from the engine's own data (see `segment_analysis.md` §1).

**What Q5 can show:** how the 35 rows are spread by start date, and which start cohorts contain people who considered or made a change.

| Start period (Q5) | n | Considered (Q15 = Yes) | Did pause/reduce/stop |
|:---|:--:|:--:|:--:|
| Less than 1 month ago | 1 | 0/1 | 0/1 |
| 1-3 months ago | 5 | 3/5 | 2/5 |
| More than 3-6 months ago | 16 | 15/16 | 6/16 |
| More than 6-12 months ago | 8 | 5/8 | 3/8 |
| More than 12-24 months ago | 4 | 0/4 | 0/4 |
| More than 2 years ago | 1 | 0/1 | 0/1 |
| **All** | **35** | **23/35** | **11/35** |

**Why this table must not be read as a drop-off curve:**
1. It is conditioned on *when the SIP started*, not on when the change happened. A person who started 6 months ago and paused in month 2 sits in the same row as one who paused in month 5.
2. The 3-6 months row is simply the biggest cohort (16/35). A large cohort will contain the largest number of events whatever the underlying timing.
3. The sample was not drawn to be representative of tenure; cohort sizes reflect how the file was built.
4. The 12+ months rows (n = 5) have zero events by construction of who is still in the sample: people who stopped long ago are not represented (survivorship).

**The only timing information about the change** is incidental text in Q22 for 8 of the 11 rows with an actual change: "month 4" or "5 months" in 6 rows (R02, R05, R08, R11, R13, R18) and "month 8" in 2 (R29, R33). Three rows (R14, R22, R25) give none. It is unstructured, unverified, and comes from class B/C rows.

---

## 3. Descriptive counts (recomputed; N = 35 unless stated)

**Reminder: these describe the constructed dataset, not respondents.**

### 3.1 Screening and profile

| Item | Counts |
|:---|:---|
| Consent (Q1) | Yes 35/35 |
| Age 18+ (Q2) | Yes 35/35 |
| SIP status at screening (Q3) | Active 25 (71.4%), paused 5 (14.3%), stopped/cancelled 4 (11.4%), completed 1 (2.9%) |
| First-ever mutual fund (Q4) | First-time 30 (85.7%), experienced 5 (14.3%), "not sure" 0 |
| Platform (Q6) | INDmoney 27 (77.1%), Groww 4 (11.4%), Zerodha Coin 2 (5.7%), AMC 1 (2.9%), bank 1 (2.9%) |
| Current status (Q7) | Active, going through 18 (51.4%); active but failed/missed instalments 5 (14.3%); paused 5 (14.3%); stopped 3 (8.6%); reduced 2 (5.7%); moved platform, still active 1 (2.9%); completed 1 (2.9%) |

**Eligibility:** all 35 pass every screening question by construction. "Eligible" here means only "passes the form's screening," which every row does.

### 3.2 Motivation and expectations

| Q8 reasons (up to 3; n/35) | | Q9 expectations (up to 2; n/35) | |
|:---|:--:|:---|:--:|
| Build a long-term habit | 20 (57.1%) | Positive returns fairly quickly | 11 (31.4%) |
| Specific life goal | 12 (34.3%) | Mainly a regular investing habit | 10 (28.6%) |
| Try MFs after learning online | 10 (28.6%) | Fluctuate but comfortable | 10 (28.6%) |
| Diversify beyond savings/FDs | 10 (28.6%) | Expected the app to explain performance | 9 (25.7%) |
| Start with a small amount | 9 (25.7%) | Someone else set expectations | 4 (11.4%) |
| Family/friends recommendation | 6 (17.1%) | No clear expectation | 4 (11.4%) |
| Creator/influencer content | 5 (14.3%) | | |
| Tax planning | 2 (5.7%) | | |
| Adviser recommendation | 1 (2.9%) | | |

Q10 (amount): comfortably affordable 14 (40.0%); minimum/easy amount 7 (20.0%); financial goal 7 (20.0%); advice from family/friends/adviser 4 (11.4%); suggested amount 3 (8.6%).

### 3.3 Behaviour after starting

| Q11 check frequency | n | Q12 looks at (n/35) | n |
|:---|:--:|:---|:--:|
| Multiple times a day | 4 | Current value | 21 (60.0%) |
| About once a day | 6 | Invested vs current value | 20 (57.1%) |
| A few times a week | 9 | Profit/loss or % return | 16 (45.7%) |
| About once a week | 4 | XIRR / annualised return | 11 (31.4%) |
| A few times a month | 6 | Upcoming SIP date/status | 10 (28.6%) |
| About once a month | 4 | AutoPay/mandate status | 8 (22.9%) |
| Only on notification/action | 1 | Individual fund performance | 4 (11.4%) |
| Rarely/never | 1 | Goal progress | 3 (8.6%) |
| | | News/market | 2 (5.7%) |

Daily or more: 10/35 (28.6%).

| Q13 first action when flat/negative | n |
|:---|:--:|
| Continue as usual | 10 (28.6%) |
| Search Reddit/forums/social | 5 (14.3%) |
| Ask friends or family | 5 (14.3%) |
| Look for an explanation in the app | 4 (11.4%) |
| Watch a YouTube/video explanation | 3 (8.6%) |
| Consider pausing, reducing or stopping | 3 (8.6%) |
| Check the app more often | 2 (5.7%) |
| Google/articles; adviser; "not experienced" | 1 each |

### 3.4 Frictions, stopping and payments

| Q14 frictions experienced (n/35) | n | Q19 sources when unsure (n/35) | n |
|:---|:--:|:---|:--:|
| Unsure whether returns were normal | 12 (34.3%) | INDmoney / the app | 18 (51.4%) |
| Terms/numbers hard to understand | 8 (22.9%) | Reddit / forums | 15 (42.9%) |
| Unsure what action to take | 8 (22.9%) | Friends or family | 11 (31.4%) |
| Auto-debit/mandate/payment failure | 8 (22.9%) | YouTube/video | 10 (28.6%) |
| Worried about wrong amount | 6 (17.1%) | Google/articles | 9 (25.7%) |
| Too many promotions/notifications | 6 (17.1%) | Official AMC info | 7 (20.0%) |
| Did not understand why instalment failed | 6 (17.1%) | Creator/influencer | 3 (8.6%) |
| Felt confident, knew what to expect | 6 (17.1%) | Adviser; none | 1 each |
| Hard to get help/support | 4 (11.4%) | | |
| Forgot upcoming instalment | 4 (11.4%) | | |
| Hard to maintain monthly amount | 4 (11.4%) | | |

Any external source other than the app or AMC (Q19): 31/35 (88.6%).

| Q15 considered stopping | n/35 | Q17 payment failure | n/35 |
|:---|:--:|:---|:--:|
| Yes, did pause/reduce/stop | 11 (31.4%) | No | 26 (74.3%) |
| Yes, but continued | 12 (34.3%) | Yes, once | 7 (20.0%) |
| No | 12 (34.3%) | Yes, more than once | 2 (5.7%) |

**Q16 main reason (n = 23, those who answered Yes to Q15):**

| Reason | All 23 | Continued (n=12) | Did change (n=11) |
|:---|:--:|:--:|:--:|
| Disappointed/confused by performance | 8 (34.8%) | 6 | 2 |
| Auto-debit/mandate/bank issue | 6 (26.1%) | 4 | 2 |
| Cash flow changed or unexpected expense | 3 (13.0%) | 0 | 3 |
| Unsure how long to stay invested | 2 (8.7%) | 2 | 0 |
| Lost confidence in app/process/service | 2 (8.7%) | 0 | 2 |
| Wanted to change amount/timing | 1 (4.3%) | 0 | 1 |
| Advice/influence from someone else | 1 (4.3%) | 0 | 1 |

**Q18 failure clarity (n = 9 who reported a failure):** mean 1.89; 1 ×3, 2 ×4, 3 ×2; none rated 4 or 5. Of the 9, 6 chose a mandate/bank issue as the main reason for considering a change.

**Confidence (Q20, 1-5):** 1: 3, 2: 11, 3: 12, 4: 4, 5: 5. Mean 2.91.

**Requested change (Q21):** clearer explanation of returns/fluctuations 11 (31.4%); goal-linked progress view 6 (17.1%); next steps on failed instalment/mandate 5 (14.3%); easier adjust/pause/restart 4 (11.4%); upcoming-instalment visibility 4 (11.4%); fewer promotions 2 (5.7%); no help needed 2 (5.7%); reliable support 1 (2.9%).

**Interview opt-ins (Q24):** Yes 7/35 (20.0%): R01-R05 (class B) plus R06 and R13 (class C). **No opt-in is a verifiable real volunteer**, and no contact file exists.

---

## 4. Subgroup cross-tabs (all small bases; descriptive only)

| Subgroup | n | Considered | Did change | Payment failure |
|:---|:--:|:--:|:--:|:--:|
| First-time | 30 | 23 (76.7%) | 11 (36.7%) | 9 (30.0%) |
| Experienced | 5 | 0 | 0 | 0 |
| INDmoney (24 of 27 first-time) | 27 | 18 (66.7%) | 8 (29.6%) | 7 (25.9%) |
| Not INDmoney | 8 | 5 (62.5%) | 3 (37.5%) | 2 (25.0%) |
| With payment failure | 9 | 8 (88.9%) | 4 (44.4%) | n/a |
| No payment failure | 26 | 15 (57.7%) | 7 (26.9%) | n/a |

**Confidence vs considering:** score 1-2 (n=14): 14 considered (100%); score 3 (n=12): 8 (66.7%); score 4-5 (n=9): 1 (11.1%).

**Do not interpret:** these bases are 5-27, drawn from a constructed set, with no inference. The 100% and 0% cells reflect how the rows were built, not behaviour.

---

## 5. Patterns in the dataset (hypotheses only)

Each pattern below needs real data before it can be called evidence.

1. **Performance worry mostly co-occurs with staying.** "Disappointed or confused by performance" is the reason for 6 of 12 who considered and continued, but 2 of 11 who actually changed. Reasons attached to actual change are more mixed (cash flow 3, lost confidence 2, mandate 2, performance 2, other 2). This echoes P00 ("anxious when red, but continues") and challenges treating red-portfolio worry as the direct driver of churn.
2. **Payment failure co-occurs with low clarity.** Mean clarity 1.89 (n = 9), and 6 of those 9 name mandate/bank issues as the main reason for considering a change. P00 independently reports the same shape: a failed debit with no recalled notification.
3. **Uncertainty about whether returns are normal is the most common friction** (12/35) and the most common request is a clearer explanation of returns (11/35).
4. **External help-seeking is common** (31/35 use a non-app, non-AMC source; Reddit 15/35), though this is partly a feature of how the rows were derived (from Reddit threads).
5. **Low confidence co-occurs with considering stopping** (14/14 at scores 1-2).

---

## 6. Contradictions and inconsistencies

| # | Contradiction | Detail |
|:--|:---|:---|
| 1 | Workbook label vs data | "Tenure" and "Core Drop-off Window" label a start-period question (see §2) |
| 2 | Row-level: R02 | Q3 = stopped/cancelled; Q7 = moved to another platform, still active; Q15 = did stop; Q22 = "cancelled it and moved to AMC direct". Is this churn or a platform migration? |
| 3 | Row-level: R08 | Q17 says a payment failure occurred, but Q14 does not tick the payment-failure option (8 vs 9) |
| 4 | Q7 vs Q17 | Only 5 rows have status "active, but ... failed/missed instalments", while 9 report a failure |
| 5 | Off-instrument answer | One Q14 answer ("I lost confidence in the app, process, or service") is a Q16 option, not a Q14 option |
| 6 | Matrix vs survey | P03 quote says ₹590 on a ₹1,200 SIP; R03's text says Rs 590 on a Rs 1,500 SIP |
| 7 | Dataset vs P00 | Dataset: 6/35 report too many promotions, with cross-sell themes in R09/R18. P00: no cross-sell irritation. Dataset: Reddit is the second most common source (15/35). P00: generally ignores dips and does not seek outside reassurance |
| 8 | Dataset vs pack | The pack says the 54.2% months 3-6 figure is "a share of signals, not a cohort churn rate"; the workbook then labels the 3-6 band "Core Drop-off Window" |
| 9 | Independence | The synthesized rows derive from the same public sources as the engine, so agreement is not validation |

---

## 7. Limitations

- **No genuine respondents** (see `01_evidence_audit.md`). All percentages are properties of a constructed file.
- **Tiny and uneven bases.** The largest comparison cell is 27; most are under 10. Several percentages move by 3 points for a single row.
- **No churn-timing variable**; no account-level verification of SIP status or payment events.
- **Self-report only**, and "considered stopping" is not time-bounded.
- **Platform mix** is dominated by INDmoney (77.1%), so any comparison with other apps is meaningless.
- **No inference.** I report no confidence intervals or significance tests, because the sampling basis gives them no meaning.
