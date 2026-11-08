# Segment Analysis: INDmoney SIP Retention

**Data:** `data/extracted/extracted_insights.jsonl` (3,079 rows; every row passed the Stage 1 relevance filter). Cross-checked against `pipeline/stage2_extract.py`, `pipeline/stage1_filter.py` and `data/eval/`.
**Status:** analyst working document. The PowerPoint is untouched.
**Read section 1 first.** It changes how much weight the segment numbers can carry.

---

## 1. Data-integrity findings that constrain this analysis

| # | Finding | Evidence | Consequence |
|:--|:---|:---|:---|
| 1 | **90.9% of rows (2,798 / 3,079) are rule-based fallbacks, not LLM extractions.** | `segment_evidence = "rule-based baseline"` and a constant `analysis_confidence = 0.76` on all 2,798. Logic: `create_fallback_extraction`, `pipeline/stage2_extract.py:120`. | Only **281 rows (9.1%)** carry real LLM judgement. |
| 2 | **In fallback rows, emotion, action, severity, experience and unmet need are derived from the star rating, not from the text.** | Rating <= 2 gives `frustrated` + `considering_stopping`; rating >= 4 gives `hopeful` + `continued`; no rating gives `confused` + `continued`. Experience is hard-coded `beginner`. Severity is hard-coded `moderate`. Unmet need is the fixed string "clearer guidance and reliable processing". | Stored `emotion`, `behavioral_action`, `severity` and `experience_level` cannot be used as independent evidence for 91% of rows. Of 1,005 `considering_stopping` rows, 996 have a rating of 1 or 2, which is the rule itself. |
| 3 | **`beginner` (93.4% of rows) is a default, not a finding.** | 2,798 of 2,876 `beginner` rows are the fallback. | No real experience-level segmentation is possible. |
| 4 | **The golden-set accuracy (95.4%) says nothing about these 3,079 rows.** | 0 of the 20 golden-set IDs in `data/eval/golden_set_engine.json` exist in `extracted_insights.jsonl`. | Do not cite 95.4% as accuracy of this dataset. |
| 5 | **The deck's "54.2% / 73% of drop-offs in months 3-6" is not reproducible from the extracted data.** | Only 68 rows have any tenure value. Of those, `months_3_6` = 6 (8.8%), `beyond_12` = 35 (51.5%), `pre_start` = 18, `month_1` = 5, `months_1_3` = 4. Months 1-6 combined = 15 of 68 (22%). The claim appears in `docs/deck_slide_spec.md` and `docs/competitor_analysis.md:39`. | n = 68, self-selected, and not limited to people who dropped off. The 54.2% / 73% claim should be removed or re-sourced before it goes in the deck. |
| 6 | **"Relevant" is a keyword match, not a judgement of SIP relevance.** | `evaluate_relevance`, `pipeline/stage1_filter.py:124`. Only 1,285 of 3,079 rows (41.7%) contain an explicit SIP/MF term in my stricter check. About 31% of the Play/App Store rows (699 of 2,243) mention stocks, F&O or trading. | "Relevant signals" below are reported two ways: pipeline-relevant and SIP-explicit. |
| 7 | **Recency can't be computed for 259 rows** (YouTube dates such as "1 year ago"). | Non-ISO `date` values. | The recency factor is unreliable for the community segment. |

### 1.1 Missing attributes (shown, not imputed)

Share of rows where each attribute is `unknown`:

| Attribute | All rows (n = 3,079) | LLM-extracted subset only (n = 281) |
|:---|:---:|:---:|
| Age hint | **98.6%** | 85.1% |
| Income hint | **98.0%** | 78.6% |
| Influence source | **92.6%** | 18.5% (but `self_research` = 65.8%) |
| SIP tenure | **97.8%** | 75.8% |
| Experience level | 1.6% | 17.8% |

- Age, income, influence and tenure are too sparse to define segments. Among the 281 LLM rows, `self_research` makes up most of the known influence values (185 of 229). That looks like a model default and is not used here.
- **I did not invent demographics.** Where a segment's age or income is unknown, I report it as unknown.

---

## 2. How the three segments were defined

Because the requested attributes are mostly missing, I built segments from **signals that are directly observed and not defaulted**:

1. **Channel**: app-store review versus community or video discussion (`source`).
2. **The user's own star rating**: observed, not inferred.

Problems, SIP relevance and stop-intent are measured by my own keyword pass over the raw `text`. That keeps the fallback defaults out of the findings. The LLM subset (n = 281) is used only as a cross-check.

| Segment | Definition | Mix |
|:---|:---|:---|
| **A. Dissatisfied app reviewers** | Play Store / App Store, rating 1-2 | INDmoney 478, Zerodha Coin 396, Groww 200 |
| **B. Satisfied or neutral app reviewers** | Play Store / App Store, rating 3-5 | INDmoney 627, Zerodha Coin 288, Groww 254 |
| **C. Community and video SIP discussers** | TradingQ&A, ValuePickr, YouTube (no rating) | Generic SIP threads 703, Zerodha 105, Groww 19, **INDmoney 9** |

**These are behavioural-context segments, not demographic ones.** Nothing in the data says who A, B or C are in terms of age, income or experience. Segment A is also defined partly by a low rating, which affects how its "severity" can be read (section 4).

---

## 3. Segment profiles

Problem categories are keyword flags on raw text. They overlap, so percentages do not sum to 100. A manual check of 15 random hits (5 each for payment/mandate, withdrawal and support) found 13 on-topic. That is a rough guide, not a measured precision.

### 3.1 Segment A: Dissatisfied app reviewers

| Metric | Value |
|:---|:---|
| **1. Signals** | **1,074** (INDmoney: 478) |
| **2. Share** | **34.9%** of corpus; **42.9%** of INDmoney signals |
| SIP-explicit | 365 (34.0%); INDmoney-only: 86 (18.0% of 478) |
| Mentions stock / F&O / trading | 277 (25.8%) |
| Avg rating | 1.17 |
| Stop / cancel / uninstall / switch keywords | 141 (13.1%); co-occurring with an SIP term: 24 (2.2%) |
| Age / income / influence / tenure unknown | 99.2% / 98.0% / 93.7% / 98.4% |
| LLM-extracted rows | 100 (experience: 33 beginner, 30 intermediate, 15 experienced, 2 first_timer, 20 unknown) |

**3. Dominant problems** (share of segment text; INDmoney-only in brackets):

| Problem | Count | % of A | INDmoney % |
|:---|:---:|:---:|:---:|
| Customer support / unresolved tickets | 224 | 20.9% | **27.6%** |
| App technical (errors, login, slowness) | 207 | 19.3% | 15.9% |
| Returns / loss / XIRR | 202 | 18.8% | 18.4% |
| Charges / fees | 117 | 10.9% | 10.0% |
| Information clarity / confusion | 106 | 9.9% | 11.3% |
| Withdrawal / redemption | 68 | 6.3% | 6.5% |
| Fund choice | 67 | 6.2% | 6.5% |
| Payment / mandate failure | 53 | 4.9% | 4.0% |
| KYC / onboarding | 43 | 4.0% | 6.1% |
| *No problem keyword matched* | 374 | 34.8% | n/a |

LLM subset (n = 100): 66% rated `critical` severity. Top product areas were app_performance (20), mandate_payment (17) and customer_support (14). Emotions were frustrated (43) and angry (33). Actions were considering_stopping (22), contacted_support (18), switched (7) and cancelled (6).

**4. Drop-off lifecycle window:** *not determinable.* Tenure is unknown for 98.4% of rows. 68 texts (6.3%) mention a duration. Among those, **22 (32%) say 1 month or less**, 11 say 2-3 months, 5 say 4-6, 15 say 7-12, and 18 (26%) say more than 12 months. Only 30 of these 68 also mention SIP or MF. These durations may describe app usage, or a wait for support ("waiting 15 days"), rather than SIP tenure. Read them as two clusters (very early and long-tenured) and nothing more.

**5. Key unmet needs** (grouped by hand from LLM-extracted strings and quotes; **illustrative, not counted**, since nearly every LLM unmet-need string is unique):
- Responsive, human-backed support. This is the only unmet need that repeats in the LLM subset (2 rows) and the most frequent problem in the text.
- Reliable withdrawal / redemption and visible status.
- Advance notice before feature removal, and explicit consent for automated actions.
- Consent for demat-folio creation, and cleaner SIP management.
- Request-style language ("wish", "please add", "should") appears in 142 rows (13.2%).

**6. Evidence quotes** (verbatim; IDs from the dataset):
- *"they create demat folios by default (without informing us) for new mutual fund investments even though it's completely unnecessary and creates hassles when you want to change platform/broker. this is a dark pattern."* (`play_indmoney_a3a61f80-8aeb-4309-af9e-e3988eaacb73`, 1 star)
- *"The UI/UX are confusing. ... It's difficult to find mutual funds purchased through INDmoney. Also, SIP management is poor."* (`play_indmoney_7d224755-1e46-474b-97ef-dfee8db48b4f`, 1 star)
- *"when you buy a sip that takes 2-3days and when you switch by mistake then it's unable to cancel after 1 min. other than this take 1 paisa extra on each order.Customer support is useless."* (`play_indmoney_e4602fcd-934e-494a-98f8-116f39f035a6`, 1 star)
- *"Changing my review after the issue is faced. recently my mutual fund investment was not getting updated and I raised the issue. Found out that customer service is really bad in this organization."* (`play_indmoney_6c850607-b24a-4e72-8536-d87b42b884b1`, 1 star)
- *"I am not able to access external mutual fund data. I have followed the scan-code steps more than 10 times. It always results in an error."* (`play_indmoney_6e9d0b8b-b17f-42e1-a238-370ca0df5442`, 1 star)

### 3.2 Segment B: Satisfied or neutral app reviewers

| Metric | Value |
|:---|:---|
| **1. Signals** | **1,169** (INDmoney: 627) |
| **2. Share** | **38.0%** of corpus; **56.3%** of INDmoney signals |
| SIP-explicit | 421 (36.0%); INDmoney-only: 180 (28.7% of 627) |
| Mentions stock / F&O / trading | 422 (36.1%) |
| Avg rating | 4.46 (3 stars: 182, 4 stars: 271, 5 stars: 716) |
| Stop / cancel keywords | 113 (9.7%); with an SIP term: 15 (1.3%) |
| Age / income / influence / tenure unknown | 99.1% / 98.3% / 92.3% / 99.1% |
| LLM-extracted rows | 107 (experience: 40 intermediate, 23 beginner, 17 experienced, 2 first_timer, 25 unknown) |

**3. Dominant problems:** B is mostly not describing problems. 720 rows (61.6%) match no problem keyword. Where they do:

| Problem | Count | % of B |
|:---|:---:|:---:|
| Returns / XIRR display | 135 | 11.5% |
| Information clarity | 94 | 8.0% |
| Fund choice / comparison | 90 | 7.7% |
| App technical | 69 | 5.9% |
| Support | 65 | 5.6% |
| Charges | 62 | 5.3% |

LLM subset (n = 107): only 10% `critical` and 43% `minor`. Emotions were confident (29), frustrated (21) and reassured (17).

**4. Lifecycle window:** not determinable (99.1% tenure unknown). Of 49 texts with a duration, 32 (65%) say more than 12 months. This is a longer-tenured user base, but also the group least likely to be at risk.

**5. Key unmet needs** (illustrative): the feature requests are more about product capability than service. Examples are comparing funds side by side, restoring a removed watchlist, XIRR visibility, more direct plans, and external portfolio aggregation. Request language appears in 230 rows (19.7%).

**6. Evidence quotes:**
- *"I don't know why Indmoeny removed the watchlist feature from the mutual fund tab, as it is useful for users who want to view how much added items in the watchlist changed for the last day to compare the funds."* (`play_indmoney_901bf7c2-1d53-4d08-a587-c263e4298ad1`, 4 stars)
- *"Using it since 4-5 years. ... Also I remember I used to see XIRR of my US portfolio but now can't see it anymore."* (`play_indmoney_88de0b3b-3c18-4cdc-b024-38432bd62ba6`, 4 stars)
- *"Very fast response to complaints and problems. ... I would still request addition of more direct Mutual fund plans as well."* (`play_indmoney_ca37e63b-ddaa-49e7-b128-685345014c87`, 5 stars)

### 3.3 Segment C: Community and video SIP discussers

| Metric | Value |
|:---|:---|
| **1. Signals** | **836** (INDmoney: **9**) |
| **2. Share** | **27.2%** of corpus; **0.8%** of INDmoney signals |
| SIP-explicit | **499 (59.7%)**; INDmoney-only: 5 |
| Stop / cancel / pause keywords | 113 (13.5%); **with an SIP term: 91 (10.9%)** |
| Rating | none (no ratings in any community source) |
| Age / income / influence / tenure unknown | 97.4% / 97.7% / 91.5% / 95.1% |
| LLM-extracted rows | 74 (experience: 24 intermediate, 22 beginner, 19 experienced, 4 first_timer, 5 unknown) |

**3. Dominant problems:**

| Problem | Count | % of C |
|:---|:---:|:---:|
| Returns / loss / market | 192 | 23.0% |
| Information clarity | 116 | 13.9% |
| Fund choice | 87 | 10.4% |
| Charges | 63 | 7.5% |
| App technical | 47 | 5.6% |
| Payment / mandate | 44 | 5.3% |
| Support | 17 | 2.0% |
| *No problem keyword matched* | 411 | 49.2% |

LLM subset (n = 74): product areas were educational_content (22), fund_selection (13) and sip_setup (8). Emotions were confident (19) and confused (15). Actions were searched_online (9), considering_stopping (7), paused (5) and asked_someone (4). Only 4 of 74 were `critical` severity.

**4. Lifecycle window:** the only segment with usable tenure signal. Of 141 texts with a duration, **102 (72%) say more than 12 months**, 23 (16%) say 7-12 months, 9 say 4-6, 5 say 2-3, and 11 say 1 month or less. Among LLM tenure tags in C (n = 74): beyond_12 = 22, pre_start = 7, **months_3_6 = 6**, month_1 = 3, months_1_3 = 3, unknown = 33. **All 6 `months_3_6` rows in the whole corpus are in this segment.** This is the one small piece of data behind the "months 3-6" idea, and n = 6 cannot support a percentage.

**5. Key unmet needs** (illustrative, from LLM strings):
- Easy pause / cancel / edit of an SIP without deleting the mandate or paperwork.
- Explanation of long-term compounding versus short-term volatility, and guidance during downturns.
- Contextualised performance metrics.
- A beginner-friendly fund filter.
- Plain-English communication of regulatory changes that affect SIP mandates.

**6. Evidence quotes:**
- *"Continuing SIP during dips just means more units in discounted price. I've not stopped my SIPs. Seh lenge thoda."* (`youtube_UgyKjY9VXP8eJlpjjAF4AaABAg`)
- *"Hello Ankur sir, I'm 25 & I've been investing in a couple of mutual funds since 2+ years now. I'm not able to understand the various types of MFs like debt, index, Nasdaq, arbitrary funds etc. and their pros and cons."* (`youtube_UgwTzOQO3jFQdKaSOWJ4AaABAg`; the only explicit age statement among the quotes, self-reported)
- *"The pause/play button feature for SIP is unique to Zerodha MF platform only. In traditional SIP the only way to stop an SIP is to cancel the ECS/NACH mandate form..."* (`tradingqa_32097`)

---

## 4. Segment comparison

| Dimension | A. Dissatisfied app reviewers | B. Satisfied app reviewers | C. Community SIP discussers |
|:---|:---|:---|:---|
| **Severity** | **High.** Avg rating 1.17; 66% `critical` in LLM subset (n = 100). *Partly by construction, since A is defined by low rating.* | Low. 10% `critical` (n = 107). | Low. 5% `critical` (n = 74); no rating to compare. |
| **Frequency** | **Highest in INDmoney data.** 34.9% of corpus, 42.9% of INDmoney signals. Top problem (support) hits 27.6% of INDmoney rows. | Largest by count (38.0%) but mostly no problem (61.6%). | 27.2% of corpus but 0.8% of INDmoney signals. |
| **Product actionability** *(analyst judgement)* | **High.** Top problems are support, app reliability, payments and withdrawals, which INDmoney controls. Weighted index 0.80. | Medium-high (0.74): feature requests; low urgency. | Medium (0.71): top problem is market returns, which INDmoney does not control. Education and pause/cancel flows are addressable. |
| **Relevance to 12-month SIP continuation** | **Weak-to-moderate.** Only 34.0% SIP-explicit (18.0% for INDmoney-only); 2.2% have stop-intent with an SIP term. Link to SIP is inferred. | Weak. 36.0% SIP-explicit; 1.3% stop + SIP. Useful as a control group. | **Strongest, but not about INDmoney.** 59.7% SIP-explicit; 10.9% stop + SIP; 72% of duration mentions are over 12 months. |

The actionability index weights each problem category by how much INDmoney can control it (1 = full, 0.5 = partial). The weights are my judgement, and the gap between segments is small. Treat it as a weak discriminator.

---

## 5. Recommendation: target Segment A (dissatisfied app reviewers)

**Within A, focus the core on INDmoney users who mention SIP or mutual funds (n = 86).** Treat A overall (n = 1,074) as the wider pool.

**Why A:**
- It is the largest group of INDmoney users showing high-severity, product-addressable friction. Support (27.6%), reliability (15.9%), returns clarity (18.4%) and fees (10.0%) are all things INDmoney can act on.
- It is the only high-severity segment with direct evidence about INDmoney users. C's INDmoney sample is 9 rows.
- Its problems are operational and visible in the text, which makes them testable.

**Why not C:** it best describes SIP continuation and long-tenure behaviour, but it can't be attributed to INDmoney. Use it as a source of hypotheses about the lifecycle (pause flows, downturn education), not as the target.

**Why not B:** satisfied users, mostly with no problem, make a poor target for retention work. Use B as a comparison group.

**Confidence: low to moderate.** The reasons:
1. A's link to SIP continuation is weak. Only 18% of INDmoney reviews in A mention SIP or mutual funds, and nothing shows these users actually stopped an SIP. The recommendation assumes that fixing service friction helps SIP continuation. The data doesn't test that.
2. A's severity is partly circular, because the segment is defined by low rating.
3. The core group of 86 rows is small and was never re-extracted with an LLM.
4. Review-writers are self-selected, and rating-triggered prompts may skew who writes a review.

---

## 6. Correlation versus causation

| Observation | What the data supports | What it does not support |
|:---|:---|:---|
| Low rating co-occurs with support / reliability / payment keywords | These topics are common in unhappy reviews | That they **caused** the low rating, or any SIP drop-off. A reviewer may mention support because they are angry about something else. |
| `considering_stopping` equals rating <= 2 | A rule in the fallback code | That 1,005 users are considering stopping. This is the rating restated. |
| Community members mention long durations (>12 months) | Active SIP discussers tend to be long-tenured | That long-tenure investors are more committed. This is survivorship: people who stopped are less likely to post. |
| 6 `months_3_6` rows, all in C | A small number of explicit mid-tenure mentions | A "months 3-6 cliff". n = 6 and no drop-off outcome is observed. |
| Segment A has more support complaints than B | Association with dissatisfaction | That better support would raise SIP continuation. |

Overall: **this dataset has no drop-off outcome and no longitudinal user data.** Reviews and posts describe stated experiences, not retention. Nothing here can establish why people stop SIPs. It can only show what unhappy and engaged users talk about.

---

## 7. Next steps to raise confidence

1. Re-run LLM extraction on the 2,798 fallback rows, starting with A, INDmoney and SIP-explicit (n = 86), so emotion, action and unmet-need fields reflect the text.
2. Re-run the golden set on IDs that exist in the current corpus before quoting accuracy.
3. Remove or re-source the "54.2% / 73% in months 3-6" claim in `docs/deck_slide_spec.md` and `docs/competitor_analysis.md` before it reaches the deck.
4. Add a real SIP-relevance filter. Only 41.7% of "relevant" rows mention SIP/MF.
5. Validate segment A with primary research (interviews or an in-app survey) that captures SIP tenure and whether a SIP was actually stopped.

---

## Method note

- Segments, problem flags, SIP / stop / duration regexes and counts were computed with a Python script over the JSONL. The script is `presentation/analysis/segment_analysis.py`; run `python presentation/analysis/segment_analysis.py` to regenerate `segment_metrics.json` (all per-segment counts used above).
- Problem categories use word-level regexes on lower-cased text and can mis-fire; a rough 15-hit spot check found 13 on-topic.
- Quotes are verbatim, shortened with ellipses where marked. Author names from `raw_metadata` were not used.
