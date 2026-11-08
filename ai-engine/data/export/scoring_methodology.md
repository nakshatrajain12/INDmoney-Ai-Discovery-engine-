# 📐 AI Discovery Engine: Scoring & Opportunity Prioritization Methodology
**Product Choice:** INDmoney SIP Retention (Mutual Funds & Growth Team)  
**System Version:** v1.0.0 (Production Verified)  
**Regulatory Boundary:** Non-Advisory (SEBI IA/EOP compliant; zero fund recommendations) & Ethical UX (Anti-FOMO).

---

## 1. Executive Summary & Objective

The AI Discovery Engine analyzes unstructured investor feedback at scale across 5 distinct sources to quantify emotional friction and prioritize product retention interventions. 

The core target metric is:
> **12-Month SIP Continuation Rate for First-Time Investors:** The percentage of first-time mutual fund investors who still have an active SIP (≥1 successful debit in the last 30 days) 12 months after their first instalment.

To determine which problem areas offer the highest return on engineering effort, the system applies a multi-factor mathematical scoring model balancing **Frequency ($F$)**, **Emotional Severity ($S$)**, **Product Actionability ($A$)**, and **Recency ($R$)**.

---

## 2. The 4-Factor Opportunity Score Formula

Every candidate theme is evaluated against four normalized parameters ($0.0 \le X \le 1.0$):

$$\\text{Opportunity Score} = (W_f \\times F) + (W_s \\times S) + (W_a \\times A) + (W_r \\times R)$$

### 2.1 Parameter Weights & Rationale

| Parameter | Symbol | Weight | Weight Rationale |
|:---|:---:|:---:|:---|
| **Frequency Share** | $F$ | **0.30 (30%)** | Measures prevalence across the 3,079 cleaned evidence corpus. Prevents over-indexing on rare edge-case complaints. |
| **Drop-Off Severity** | $S$ | **0.30 (30%)** | Quantifies emotional friction and intent to abandon. A high-severity issue (e.g. unexpected bank bounce fees) carries equal weight to pure volume. |
| **Product Actionability**| $A$ | **0.25 (25%)** | Evaluates INDmoney's technical and operational ability to resolve the issue within SEBI non-advisory constraints. (e.g., market macro crashes have low actionability; pre-debit alerts have high actionability). |
| **Recency Decay** | $R$ | **0.15 (15%)** | Weights recent investor feedback (post-2025/2026 UPI Autopay regulatory shifts) higher than historical legacy complaints. |

*Note: Weights sum to exactly $1.00$ ($0.30 + 0.30 + 0.25 + 0.15 = 1.00$), producing a normalized score between $0.000$ and $1.000$ (scaled to $0–100$ for executive presentation).*

---

## 3. Parameter Quantification & Threshold Definitions

### 3.1 Frequency ($F$)
Normalized against the maximum theme scale in the corpus:
$$F = \\frac{\\text{Theme Corpus Volume}}{\\max(\\text{Theme Volumes})} = \\frac{N_{\\text{theme}}}{829}$$

For corpus-wide share percentage:
$$\\text{Corpus Share \\%} = \\frac{N_{\\text{theme}}}{N_{\\text{total}}} = \\frac{N_{\\text{theme}}}{3,079} \\times 100$$

### 3.2 Severity ($S$)
Computed as the arithmetic mean of individual friction severity tags mapped via `SEVERITY_MAP`:

$$S = \\frac{1}{N_{\\text{theme}}} \\sum_{i=1}^{N_{\\text{theme}}} \\text{SeverityScore}(i)$$

| Categorical Severity | Numeric Score | Operational Definition |
|:---|:---:|:---|
| `minor` | **0.333** ($1/3$) | Minor cosmetic bug, informational curiosity, or low-urgency feature request. |
| `moderate` | **0.667** ($2/3$) | Cognitive confusion (XIRR terminology), flat return disappointment, or mild cross-selling annoyance. |
| `critical` | **1.000** | Acute financial friction: bank debit bounce fee (₹300), unannounced mandate expiry, or loss of capital panic. |

### 3.3 Actionability ($A$)
Assigned based on INDmoney's architectural and regulatory control:
- **0.95:** 100% within INDmoney UI/UX control (Information clarity, suppress loan banners, pre-debit check-in).
- **0.90:** High control with third-party banking integration (UPI Autopay mandate retry, bank bounce mitigation).
- **0.80–0.85:** Moderate control requiring educational or customer support restructuring.
- **$\le 0.70$:** Low control (Macroeconomic market crashes, SEBI regulatory mandates, bank interest rates).

### 3.4 Recency ($R$)
Evaluated via time-decay schedule relative to analysis execution timestamp:
- **1.00:** Review / post created within the last 12 months ($\\le 365$ days).
- **0.75:** Review created between 12 and 24 months ago ($365 < \\text{days} \\le 730$).
- **0.45:** Historical legacy review ($> 730$ days).
- **Default (0.65):** Assigned when publication timestamp is non-ISO or missing (e.g. YouTube '1 year ago').

---

## 4. Item-to-Theme Affinity Scoring Algorithm

Each extracted data point is assigned to its best-fit theme in Stage 3 using multi-dimensional affinity matching:

$$\\text{AffinityScore}(D_i, T_j) = S_{\\text{dq}} + S_{\\text{area}} + S_{\\text{emotion}} + S_{\\text{kw}} + S_{\\text{action}}$$

1. **Discovery Question Overlap ($S_{\\text{dq}}$):** $+2.0$ points per overlapping question ($Q_1$ to $Q_9$).
2. **Product Area Match ($S_{\\text{area}}$):** $+2.5$ points if item product area matches theme canonical areas.
3. **Primary Emotion Match ($S_{\\text{emotion}}$):** $+1.5$ points if extracted emotion aligns with theme emotional signature.
4. **Keyword Matches ($S_{\\text{kw}}$):** $+1.5$ points per keyword match in full text; $+2.0$ points if keyword appears in `key_quote`.
5. **Behavioral Action Heuristic ($S_{\\text{action}}$):** $+1.5$ to $+2.0$ points for high-signal actions (`paused`, `cancelled`, `considering_stopping`, `uninstalled`).

---

## 5. Dynamic Segment-Adjusted Scoring (Interactive Re-ranking)

When exploring specific user segments (e.g. First-timers in Months 3–6 on `/segments`), the engine recalculates theme priority dynamically:

$$\\text{Segment Multiplier} = 0.5 + \\left(\\frac{\\text{Segment Count in Theme}}{\\text{Total Segment Items in Corpus}}\\right) \\times 1.5$$

$$\\text{Score}_{\\text{adjusted}} = \\min(0.999, \\text{Base Opportunity Score} \\times \\text{Segment Multiplier})$$

This dynamically surfaces the most urgent themes for specific cohorts without distorting baseline corpus truths.

---

## 6. Retention Sensitivity Model (KPI Tree Formula)

The discovery engine connects directly to the business metric via sequential stage probabilities:

$$\\text{12M Active Rate} = (P_1 \\times P_2 \\times P_3 \\times P_4) + P_5$$

| Funnel Stage | Parameter | Industry Baseline | Target Post-Intervention | Strategic Driver |
|:---|:---:|:---:|:---:|:---|
| **Setup & Day 1 Shock** | $P_1$ | 81.6% | **84.0%** (+2.4%) | Simplified onboarding, first red-day context |
| **Autopay Mandate (M2–3)** | $P_2$ | 93.7% | **97.0%** (+3.3%) | Mandate Auto-Healer, pre-debit reminder |
| **Cliff Window (M3–6)** | $P_3$ | **45.8%** | **63.5%** (**+17.7%**) | **Pre-Debit Check-in (Skip/Lower/Pause) & Milestone Reassurance** |
| **Guidance (M6–12)** | $P_4$ | 78.4% | **83.0%** (+4.6%) | Wealth Sanctuary Mode (suppress loan ads) |
| **Reactivation Loop** | $P_5$ | 3.5% | **7.5%** (+4.0%) | 1-tap pause revival & auto-resume date |

### Mathematical Result:
$$\\text{Baseline 12M Active Rate} = (0.816 \\times 0.937 \\times 0.458 \\times 0.784) + 0.035 = \\mathbf{30.95\\%}$$
$$\\text{Targeted 12M Active Rate} = (0.840 \\times 0.970 \\times 0.635 \\times 0.830) + 0.075 = \\mathbf{50.45\\%}$$
**Net Impact: +19.5% Absolute Retention Lift (+63.0% Relative Cohort Expansion).**