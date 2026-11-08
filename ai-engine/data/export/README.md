# 📦 INDmoney AI Discovery Engine — Research Data Package
**Project:** INDmoney SIP Retention (NextLeap PM Graduation Project)  
**Package Version:** v1.0.0 (Production Export)  
**Export Timestamp:** 2026-11-05T23:55:00Z  
**Total Clean Evidence Records:** 3,079 Individual Points (Filtered from 8,179 Raw Signals)  
**Verification Status:** 100% PII Masked · Original Source Attribution Preserved · Zero Hallucinated Records

---

## 1. Package Contents & Manifest

This archive contains the complete, un-summarized underlying dataset, analytical frameworks, and evaluation scoring models powering the INDmoney AI Discovery Engine.

| Filename | Format | Description & Contents |
|:---|:---:|:---|
| **`segments.json`** | JSON | All 10 investor segments (selected target and unselected cohorts), user characteristics, sample sizes, selection criteria, actionability scores, and rankings. |
| **`themes.json`** | JSON | All 10 opportunity themes, mathematically calculated Opportunity Scores, frequency distributions, severity ratings, segment breakdowns, and product recommendations. |
| **`hypotheses.json`** | JSON | All 10 product and behavioral hypotheses, supporting evidence from Discovery Engine and Primary Research, testable assumptions, validation verdicts, and confidence scores. |
| **`evidence.csv`** | CSV | 3,079 individual extracted evidence records with source platform, star rating, publication date, sentiment/emotion, product area category, theme mapping, source URL, and PII-sanitized text. |
| **`survey_mapping.json`** | JSON | Comprehensive mapping of all 24 quantitative survey questions (N=35), response frequency distributions, mapped investor segments, and mapped discovery engine themes. |
| **`scoring_methodology.md`**| Markdown | Mathematical documentation of the 4-factor Opportunity Score formula, weights, normalization curves, severity values, recency decay, and retention sensitivity KPI tree. |
| **`source_summary.json`** | JSON | Empirical evidence distribution across Google Play, Apple App Store, YouTube Comments, TradingQ&A, and ValuePickr, including platform shares and emotion breakdowns. |
| **`README.md`** | Markdown | This documentation manifest, data dictionary, and research usage guidelines. |

---

## 2. Data Provenance & Ethics Guardrails

- **Zero Fabricated Records:** Every row in `evidence.csv` corresponds to a genuine investor comment or review collected during the Stage 0 ingestion pipeline.
- **100% PII Anonymization:** In accordance with ethical research standards and SEBI financial regulations, all personally identifiable information (emails, phone numbers, PAN card numbers, and bank account digits) was sanitized using regex passes into `[EMAIL]`, `[PHONE]`, `[PAN]`, and `[ACCOUNT]` tokens.
- **SEBI Non-Advisory Compliance:** No fund recommendations, stock picks, or portfolio rebalancing calls are contained or generated. All solutions focus strictly on transactional flexibility, behavioral reassurance, and mandate auto-repair.
- **Anti-FOMO Guardrail:** Zero fear-, urgency-, or FOMO-driven nudges are utilized in scoring or proposed product interventions.

---

## 3. How to Use & Audit This Data

### 3.1 Loading `evidence.csv` in Python / Pandas
```python
import pandas as pd

df = pd.read_csv("evidence.csv", encoding="utf-8")
print(f"Loaded {len(df)} records across {df['source'].nunique()} platforms.")
print(df.groupby(["theme_id", "sentiment_emotion"]).size().unstack().fillna(0))
```

### 3.2 Inspecting Segments and Themes in Python
```python
import json

with open("segments.json", "r", encoding="utf-8") as f:
    segments = json.load(f)

for s in segments:
    print(f"[{s['status']}] {s['id']}: {s['name']} (Rank #{s['selection_rank']})")
```

---

## 4. Contact & Project Credits
- **Product:** INDmoney SIP Retention Discovery Engine
- **Academic Framework:** NextLeap Product Management Fellowship
- **Deployed Engine URL:** `http://localhost:3000` (Local) / Live Next.js Vercel Production