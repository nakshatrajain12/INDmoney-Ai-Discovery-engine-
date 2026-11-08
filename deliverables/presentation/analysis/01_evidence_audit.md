# 01 Evidence Audit: Provenance of the INDmoney SIP Research Files

**Audit date:** 2026-11-02
**Files inspected:** `research/survey_clean_anonymized.csv`, `research/INDmoney_SIP_Retention_Research_Pack_Completed.xlsx` (3 sheets), `research/INDmoney_Research_Pack_v1_1.md`, `research/actual_interviews/` (empty). Cross-checked against `docs/`, `README.md` and the earlier `analysis/segment_analysis.md`.
**Nothing was modified.** Application code and the original PPTX are untouched.

---

## 1. Bottom line

| Question | Finding |
|:---|:---|
| How many genuine primary survey responses are in the CSV? | **0 of 35 are evidenced as genuine.** |
| What are the 35 rows? | **5 rows (R01-R05)** are anchored to specific public Reddit threads. **30 rows (R06-R35)** are labelled "Synthesized from r/MutualfundsIndia, r/mutualfunds & INDmoney user reviews". |
| Do P01-P05 exist as interviews? | **No.** They are public-review-derived profiles built from survey rows R01-R05. `actual_interviews/` contains no interview files. |
| Is the workbook P00 row reliable? | **No.** It contradicts the actual P00 interview in the research pack on first-time status, SIP situation, friction and attitude to cross-selling. Use the pack's Section 16. |
| Only genuine primary evidence on file | **P00**: one interview with the project owner (not independent, a continuing user). |
| Can the CSV or workbook be cited as "survey findings"? | **No.** Their counts describe a constructed dataset. They cannot be reported as respondent prevalence on any slide. |

The pack itself says this was not supposed to happen. Its integrity note (line 10) and status line (line 8) say it contains no fabricated survey responses or interview transcripts, and that survey results and the five target interviews are "still pending". The CSV and workbook were not produced by the protocol the pack describes.

---

## 2. Classification scheme

| Class | Meaning |
|:---|:---|
| **A** | Genuine primary survey response (a person completed the instrument) |
| **B** | Public review or forum evidence, including a record rebuilt from named public posts |
| **C** | Synthesized research profile |
| **D** | Unknown provenance |

Classification rests on `Public_Source_Anchor`, the only provenance field in the file. The CSV has no timestamps, form metadata, raw export or contact-file link. The pack's own protocol (Section 12) expects a `survey_raw_export.csv`, and none exists in the repo.

### 2.1 Result

| Class | Rows | Count |
|:---|:---|:---:|
| A. Genuine primary | none | **0** |
| B. Public-forum-derived | R01, R02, R03, R04, R05 | **5** |
| C. Synthesized | R06-R35 | **30** |
| D. Unknown | none (every row has an anchor) | **0** |

**Caveat on A = 0.** I can't prove that no real person's answers sit behind any row. But the file offers no evidence of one, and every anchor says the content came from public sources.

**Caveat on B.** R01-R05 name specific threads, but the rows are survey-format records with answers to Q8-Q21 (check frequency, confidence score, platform, and so on). A public post doesn't contain most of those fields, so the structured answers must have been inferred or written. Only the free text (Q22, Q23) may track the public posts, and I couldn't check even that. No URLs or post IDs are given, and I didn't browse Reddit. Treat R01-R05 as **forum-derived and unverified, not as respondents**.

### 2.2 Row-level provenance (all 35 rows)

| Row | Code | Class | Anchor (abridged) | Interview opt-in |
|:--|:--|:--:|:---|:--:|
| R01 | AX27 | B | r/MutualfundsIndia & r/mutualfunds XIRR-drop threads (2026) | Yes |
| R02 | BK19 | B | r/MutualfundsIndia: "Unable to edit sip amount in indmoney+underlying google pay autopay mandate"; "INDmoney moving MF purchases to demat" | Yes |
| R03 | CM44 | B | r/MutualfundsIndia: "Issue with INDmoney Daily SIP"; r/mutualfunds: "SIP Autodebit mandate failed and resulted in penalty" | Yes |
| R04 | DN82 | B | r/MutualfundsIndia: "Stop Your SIPs - Shankar Sharma" comment; r/StockMarketIndia INDmoney benchmark praise | Yes |
| R05 | EP51 | B | r/MutualfundsIndia: "How are we supposed to make money in this sideways market?"; "First time investing outside of FDs" | Yes |
| R06 | FQ12 | C | "Synthesized from r/MutualfundsIndia, r/mutualfunds & INDmoney user reviews (2025-2026)" | Yes |
| R07-R12 | GR33, HS64, JT08, KU91, LV20, MW75 | C | same | No |
| R13 | NX43 | C | same | Yes |
| R14-R35 | OY16 ... KU83 | C | same | No |

All 35 anchors were read individually. R07-R35 repeat the identical "Synthesized from ..." string; only R01-R05 carry thread-specific anchors.

### 2.3 Independent signs that the rows are constructed

These support the anchors. None of them alone would be conclusive.

1. **Participant codes are machine-sequential.** The first letters run `A B C D E F G H J K L M N O P Q R S T U V W X Y Z A B C D E F G H J K` (skipping I) across R01-R35. The pack (Q25) asks respondents to *choose* a memorable two-letter, two-digit code. Self-chosen codes wouldn't follow the alphabet.
2. **Perfect screening (weak signal).** 35/35 consent, 35/35 aged 18+, 35/35 have started a SIP. The file is described as "clean", so ineligible rows may simply have been removed before export. This point only matters alongside the others.
3. **R01-R05 fit the pack's five interview slots exactly.** They match slots P01 at-risk continuer, P02 paused/stopped, P03 payment-friction, P04 confident continuer, P05 external-validation seeker from pack Section 6.1. That section says: "if the sample does not contain one, report the gap rather than inventing a participant."
4. **Every free-text field is complete.** Q22 and Q23 are filled for all 35 rows, though the pack makes them optional.
5. **Rows carry cross-field outcomes that read as scripted.** For example, every respondent with confidence 1-2 (14 of 14) considered stopping.
6. **Off-instrument answer.** One row's Q14 answer is "I lost confidence in the app, process, or service", an option the instrument lists under Q16 only.

---

## 3. Workbook vs CSV

| Check | Result |
|:---|:---|
| `Survey_Clean_35` sheet vs CSV | **Identical.** 35 rows, same columns. The only difference is `1` vs `1.0` formatting in Q18 (9 cells). |
| `Quantitative_Analysis` sheet | Title says "N = 35 **Eligible Respondents**". That label is wrong (see 2). Arithmetic is checked in `02_survey_analysis.md`. |
| `Interview_Coding_Matrix` sheet | Columns `Verbatim_Quote_From_Public_Review` and `Public_Review_Source` show the content is review-derived. |
| Workbook formulas | None. All values are hard-coded, so they don't update if the data changes. |

---

## 4. Interview audit

### 4.1 P01-P05 are not interviews

| Evidence | Detail |
|:---|:---|
| Matrix column names | `Verbatim_Quote_From_Public_Review`, `Public_Review_Source` |
| Source cells | e.g. "Reddit r/mutualfunds & r/MutualfundsIndia (2026 XIRR drop threads)" |
| One-to-one link to survey rows | `Survey_Code` = AX27 (R01), BK19 (R02), CM44 (R03), DN82 (R04), EP51 (R05). Those are exactly the five class-B rows. |
| Files | `research/actual_interviews/` contains only `.gitkeep`. No P01-P05 notes exist. |
| Pack status | Section 15 lists "Conduct the five interviews" as a pending step. |

So P01-P05 are **public-review-derived profiles**, not interview participants. No quote from them may be presented as something a participant said to the team.

### 4.2 The matrix disagrees with the survey rows it claims to represent

| Item | Matrix | CSV row | Issue |
|:---|:---|:---|:---|
| **P03 / R03 bounce penalty** | quote: "my bank charged ₹590 on a **₹1,200** SIP!" | Q22: "Rs 590 bounce penalty on a Rs **1,500** SIP" | Principal amount differs between the two documents |
| **P02 / R02 status** | "Stopped/cancelled on INDmoney; recreated on AMC/MF Central" | Q7 = "moved the SIP to another platform, **but it is still active**"; Q3 = "stopped/cancelled"; Q15 = did stop | The same person is coded three different ways. A migration is not churn from SIP investing. |
| **P03 quote** | "3rd Dec and 4th Dec were normal market days..." | Q22 wording differs | The matrix "verbatim" does not match the survey text. At least one is paraphrase. |

### 4.3 P00: workbook vs the actual interview (canonical)

The canonical P00 is **Section 16 of `INDmoney_Research_Pack_v1_1.md`** (lines 853-1004).

| Dimension | Workbook P00 row | Actual P00 interview (canonical) | Verdict |
|:---|:---|:---|:---|
| Role | "Longitudinal Expert User" | Student; pocket money is the main source of funds | Workbook omits life stage |
| First mutual-fund investor | "No (3-yr user)" | **Not confirmed**; the interview explicitly says do not infer | Workbook asserts something unknown |
| Tenure | ">2 years (~36 months)" | ~3 years on INDmoney, **~2 years on the SIP** | Workbook conflates platform and SIP tenure |
| SIP status | "Active; multi-SIP & **full portfolio tracker**" | Three small SIPs, ₹500/month at start, ₹850/month now; also IPOs and US markets | Amounts and "portfolio tracker" framing absent in workbook |
| Triggering event | Recent UI update, "Switch Regular to Direct" prompts, Demat vs SoA toggle | **One failed debit (insufficient balance) and a ₹300 bank penalty**, with no notification recalled | **Contradiction.** None of the workbook's events appear in the interview. |
| Main friction | Cross-sell clutter, hidden SoA toggle, no LTCG context | Unexplained failed-debit/penalty; self-taught terminology | **Contradiction** |
| Cross-selling | Presented as a core friction | "Does not recall being distracted by ads or cross-selling"; finds offerings interesting | **Direct contradiction** |
| Workaround | Verifies units on MF Central/CAMS; checks r/mutualfunds for tax math | Generally ignores short-term dips; no routine outside reassurance | **Contradiction** |
| Verbatim quote | About the ₹1.25L LTCG limit and benchmark compare | Not among the eight verbatim anchors in 16.3 | **Not from the interview** |
| Source cell | "Project Owner 3-Year ... Review + r/mutualfunds & r/IndianStreetBets threads" | Conversational 14-question interview | Workbook P00 appears to blend public-forum content into the owner's profile |

**Use the pack's Section 16 and discard the workbook P00 row.** The same rows (R09, R18, R23) carry the cross-sell/Demat/UI-update themes in the survey, so the workbook P00 reads as if it shares themes with the synthesized rows, not with the real interview.

---

## 5. What counts as evidence now

| Evidence | Type | Independent? | Usable as |
|:---|:---|:---:|:---|
| P00 interview (pack §16) | Primary, n = 1 | No (project owner) | Labelled researcher-user perspective; hypotheses only |
| Discovery-engine corpus (3,079 public reviews/forum posts) | Public signals | Yes (of the team) | Language, pain points, workarounds; **not prevalence** (see `segment_analysis.md` §1) |
| R01-R05 | Forum-derived, survey-formatted | No | Illustration of themes seen on Reddit; not respondents |
| R06-R35 | Synthesized | No | **Nothing.** Do not cite. |
| P01-P05 | Review-derived profiles | No | Illustration only; never "interviews" |

**Circularity warning.** Rows R06-R35 are stated to derive from the same kinds of public sources (Reddit and INDmoney reviews) as the discovery engine. Agreement between this "survey" and the engine therefore cannot count as independent validation. (The engine's own Reddit file, `data/raw/reddit_posts.jsonl`, was empty, so the engine and these rows don't even share the same Reddit content.)

---

## 6. Recommended handling

1. Treat the CSV, workbook `Quantitative_Analysis` and `Interview_Coding_Matrix` as **a synthetic or illustrative dataset**, and label it that way in any file name or slide note.
2. Do not use it for headline percentages, personas as "users interviewed", or "N = 35 respondents" on a slide.
3. Keep P00 as the only primary interview, labelled researcher-user.
4. Correct the workbook P00 row from pack Section 16 before the workbook is used for anything.
5. See `02_survey_analysis.md` for the numbers and `03_research_gaps.md` for what real research is needed.
