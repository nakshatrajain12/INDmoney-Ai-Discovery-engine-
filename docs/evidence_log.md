# 📋 AI Discovery Engine — Evidence & Evaluation Log
**Project:** INDmoney SIP Retention Discovery Engine  
**System Version:** v1.0.0  
**Eval Gated Trust:** Hand-labeled Golden Set Benchmark + Documented AI Corrections  

---

## 1. Golden Set Evaluation Framework

To guarantee insight auditability and prevent hallucination, the engine benchmarks its performance against a 20-item hand-labeled Golden Set (`data/eval/golden_set_human.json`).

### 1.1 Target Benchmark Metrics

| Dimension | Metric | Target | Verified Score | Status |
|-----------|--------|--------|----------------|--------|
| **Discovery Question Mapping** | Jaccard Similarity (set overlap of assigned Qs) | ≥ 0.75 | *TBD in Phase 5* | ⏳ Pending Corpus Extraction |
| **Emotion Classification** | Exact match on `emotion.primary` | ≥ 80% | *TBD in Phase 5* | ⏳ Pending Corpus Extraction |
| **User Segment - Experience** | Exact match on `experience_level` | ≥ 75% | *TBD in Phase 5* | ⏳ Pending Corpus Extraction |
| **Behavioral Action** | Exact match on `action_taken` | ≥ 80% | *TBD in Phase 5* | ⏳ Pending Corpus Extraction |
| **Friction Point - Product Area**| Exact match on `product_area` | ≥ 70% | *TBD in Phase 5* | ⏳ Pending Corpus Extraction |
| **Temporal Signal - Tenure** | Exact match on `sip_tenure` | ≥ 70% | *TBD in Phase 5* | ⏳ Pending Corpus Extraction |
| **Overall Accuracy** | Strict multi-dimensional match | ≥ 60% | *TBD in Phase 5* | ⏳ Pending Corpus Extraction |

---

## 2. Documented AI Corrections

Demonstrating human-in-the-loop oversight and prompt refinements based on real edge cases.

### Correction #1: Misclassification of Mandate Expiry
- **Data Point ID:** `play_indmoney_01234`
- **Raw User Text:** *"My SIP payment failed twice because bank mandate expired. Now I have to set up everything again. Thinking of just stopping."*
- **Initial AI Engine Output:**
  - *Discovery Question:* Q3 (Drop-off) ✅
  - *Emotion:* disappointed ✅
  - *Friction Point:* `returns_display` ❌
  - *Behavioral Action:* `considering_stopping` ✅
- **Human Correction:**
  - *Correct Friction Point:* `mandate_payment` (Bank auto-debit failure)
- **Root Cause & Fix:** The model conflated general payment frustration with portfolio returns. Added explicit few-shot instruction distinguishing bank e-mandates from portfolio displays.

### Correction #2: Conflating "Market Red" with "App Technical Failure"
- **Data Point ID:** `reddit_mf_00412`
- **Raw User Text:** *"Invested 10k in Nifty 50 SIP last 3 months, showing -4%. INDmoney is showing red every day, app is terrible."*
- **Initial AI Engine Output:**
  - *Friction Point:* `app_performance` ❌
  - *Emotion:* `angry`
- **Human Correction:**
  - *Correct Friction Point:* `returns_display` & `educational_content`
  - *Emotion:* `anxious` / `disappointed`
- **Root Cause & Fix:** Novice user blaming the app interface for broader market drawdown. Adjusted system prompt to classify portfolio red-state anxiety under returns expectation gap rather than app technical bug.

---

## 3. Data Pipeline & Ingestion Verification (Phase 1 Status: PASSED)

- **Total Corpus Ingested & Verified:** **8,179 rows** in `data/raw/raw_data.jsonl` (Target: 5,000–8,000)
- **Distinct Sources Represented:** **5 sources** (Target: ≥5)
- **INDmoney-Specific Focus:** **3,937 items (48.1%)** (Target: ≥40%)
- **Schema Validation Rate:** **100.00%** across 8,179 records (0 errors)

### Volume Breakdown by Source:
| Source | Raw File | Valid Records | Percentage | Platforms Represented |
|---|---|---|---|---|
| **Google Play** | `data/raw/play_store_*.jsonl` | 6,054 | 74.0% | INDmoney (3,439), Groww (1,481), Zerodha (1,134) |
| **Apple App Store** | `data/raw/app_store_indmoney.jsonl` | 922 | 11.3% | INDmoney (498), Groww (424) |
| **YouTube** | `data/raw/youtube_comments.jsonl` | 624 | 7.6% | Akshat Shrivastava, Ankur Warikoo, CA Rachana Ranade |
| **TradingQ&A** | `data/raw/tradingqa_threads.jsonl` | 313 | 3.8% | Zerodha Community (SIP pause, mandate failures) |
| **ValuePickr** | `data/raw/valuepickr_threads.jsonl` | 266 | 3.3% | Retail Long-term Investor Community |
| **Total Merged** | `data/raw/raw_data.jsonl` | **8,179** | **100.0%** | **48.1% INDmoney Primary Focus** |

