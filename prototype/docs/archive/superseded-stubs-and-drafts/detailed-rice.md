# Detailed RICE: Return Coach, Debit Explainer, Pause and Restart

**Status:** Draft v1 · **Date:** 2026-11-08 · **Inputs:** `research-context.md` (N=26 survey; interviews P01–P05, P00 contextual only), `problem-statement.md`, `product-requirements.md`, `implementation-plan.md`.

**Read this first.** RICE here is a **transparent prioritisation aid, not data.** Reach comes from a small mixed-platform survey; Impact and Confidence are judgements; Effort comes from the implementation plan's estimates. The scores do not separate the first two modules, and the sequencing decision rests on evidence strength, risk and dependencies as much as on the arithmetic (§7).

---

## 1. Method

**Score = (Reach × Impact × Confidence) ÷ Effort.** Same convention as the deck (slide 7), so the two can be compared.

| Factor | Definition used | Scale | Source |
|---|---|---|---|
| **Reach (R)** | Share of the N=26 survey sample affected by the problem the module addresses, × 10 | 0–10 | Survey CSV (N=26), recomputed |
| **Impact (I)** | Judged effect on keeping a first-year SIP active, *if the module works as designed* | 1–10 | Team estimate; **no measured effect exists** |
| **Confidence (C)** | Strength of evidence that the problem exists *and* that the module addresses it | 1–10 | Evidence tiers in `research-context.md` §5–7 |
| **Effort (E)** | Relative build effort | days | `implementation-plan.md` phase estimates (Phase 3 = 5, Phase 4 = 3, Phase 5 = 4) |

**Limits of the Reach definition [F]:** survey shares are not counts of INDmoney users; INDmoney is 11 of 26; the sample includes five rows that mirror interview cases. A production RICE needs real cohort counts (§6).

---

## 2. Reach: derived from the survey (N=26)

| Module | Problem addressed | Affected definition | Count | Share | R (share × 10) |
|---|---|---|---|---|---|
| **Return Coach** | Not knowing if returns are normal; confusing terms | Selected "Unsure if returns were normal" or "Confusing performance terms" | **13/26** | 50.0% | **5.0** |
| **Debit Explainer** | Payment or mandate issue with unclear reason or next step | Dedicated question answered "Yes, once" or "Yes, more than once" | **11/26** | 42.3% | **4.2** |
| **Pause and Restart** | Cash-flow shock or amount strain needing a pause, reduce or restart | Main reason = income drop or unexpected expense (4), or chose "easier pause or edit controls" as the most valuable change (3), or reported worry about or difficulty maintaining the amount (4); union | **7/26** | 26.9% | **2.7** |

**Alternative Reach definitions for Pause and Restart (sensitivity):**

| Definition | Count | R |
|---|---|---|
| Cash-flow reason only | 4/26 | 1.5 |
| Union above (used) | 7/26 | 2.7 |
| Currently paused or stopped | 5/26 | 1.9 |
| Sized their SIP by monthly affordability (broadest "exposure") | 15/26 | 5.8 |

**Combined reach of all three modules [F]:** 22/26 respondents have at least one of the three problems (13 + 11 + overlaps; Pause adds 3 people who have neither of the other two). Overlaps: 5 respondents have both return confusion and a payment issue.

**Not counted:** respondents who need none of the three (4/26).

---

## 3. Impact: judged, with rationale

| Module | I | Rationale | Evidence for the mechanism | Honest limit |
|---|---|---|---|---|
| Return Coach | **6** | Addresses the most common stated problem and the dominant reason given for considering a change (7/26 named confusing or disappointing returns as the main reason; 3 of the 6 who changed said this) | P01, P05: doubt resolved by an explanation from outside the app | Confusion does **not** clearly separate who changes course (first-year first-timers 2/9 vs 1/5); P01 stayed partly because the loss was small |
| Debit Explainer | **5** | Payment issue is the one factor showing a descriptive gap in *actual* change (4/11 vs 1/14; p≈0.13); a clear next step can convert a missed instalment into a recovered one | P03: continued after a manual retry; 4 of 11 affected rated clarity 1–2 | Not causal; considering a change was equal (8/11 vs 8/14); recovery depends on payments infrastructure, not only explanation |
| Pause and Restart | **4** | Addresses the one fully documented actual stop (P02) and prevents a temporary pause becoming permanent | P02: paused, no restart reminder, still paused after three months | Based on one interview and 1 of 6 respondents who changed course; benefit depends on platform support and user opt-in |

These are team judgements. They are **not** derived from the survey and have no measured effect behind them.

---

## 4. Confidence: from the evidence tiers

| Module | C | Basis |
|---|---|---|
| Return Coach | **7** | T3 Information Desert is the strongest-supported problem (11 unsure, 11 confusing terms, 16 confidence 1–3, 9 chose clearer explanations); P01, P05. Reduced from 8 because the link from confusion to actually stopping is not established and the segment is 5 Groww / 4 INDmoney |
| Debit Explainer | **6** | T4 validated at problem level (11/26; clarity low among affected); P03. Reduced because causality is unproven and the rules and provider codes are not yet available |
| Pause and Restart | **5** | P-H1 reframed and supported at problem level; P02; 3/26 chose easier pause controls. Reduced because feature demand and lift are untested and platform capability is unconfirmed |

---

## 5. Effort: from the implementation plan

| Module | E (days) | Source | Notes |
|---|---|---|---|
| Return Coach | **5** | Phase 3 (plus Phase 2 returns engine, shared) | Templates-only; the content and source library are the critical path. The optional LLM rephraser (Phase 7) is **not** in this estimate |
| Debit Explainer | **3** | Phase 4 | Deterministic rules table; no LLM. Real provider codes would add integration effort later |
| Pause and Restart | **4** | Phase 5 | State machine, scheduler, reminders; depends on platform capability |

**Why Debit Explainer's effort differs from the deck (5 → 3).** The deck's S2 assumed an AI-assisted explainer; the selected scope is **rules-based with no LLM**, which is cheaper. This is a change of *scope*, not new evidence.

---

## 6. Scores

| Module | R | I | C | E | **Score** | Rank |
|---|---|---|---|---|---|---|
| **Return Coach** | 5.0 | 6 | 7 | 5 | **42.0** | 1 (tie) |
| **Debit Explainer** | 4.2 | 5 | 6 | 3 | **42.0** (42.3 unrounded R) | 1 (tie) |
| **Pause and Restart** | 2.7 | 4 | 5 | 4 | **13.5** | 3 |

Arithmetic: 5.0×6×7÷5 = 42.0; 4.2×5×6÷3 = 42.0; 2.7×4×5÷4 = 13.5.

**Production RICE (to do once INDmoney data exists).** Replace Reach with *first-time SIP investors in their first 12 months, per quarter, who reach the trigger* (a flat or red figure; a failed debit; a pause action), using real cohort counts and trigger rates. Use measured effect sizes from the experiments (`product-requirements.md` §11) for Impact, and the post-prototype effort for E.

### Comparison with the deck's RICE (slide 7)

| | Deck (S1 Return Coach / S2 Debit Rescue / S3 Doubt Assistant) | This document |
|---|---|---|
| Reach | 5.0 / 4.2 / 7.3 (N=26 recomputation) | 5.0 / 4.2 / 2.7 (Pause) |
| Score | 60 / 25 / 60 | 42 / 42 / 13.5 |
| Why different | Deck used E = 4 / 5 / 6 (AI-based debit explainer and combined assistant), I = 6 / 5 / 7, C = 8 / 6 / 7 | Scope changed to three separate modules; Debit is rules-only (E = 3); the bundle is no longer an option; C for Return Coach lowered from 8 to 7 after the N=26 findings |

The earlier S3 bundle is not scored here because it is not in scope; its reach (19/26) was a union by construction (see the audit).

---

## 7. Sensitivity: how robust is the ranking?

### 7.1 One-at-a-time changes

| Change | Return Coach | Debit Explainer | Pause and Restart | Effect on ranking |
|---|---|---|---|---|
| Base | 42.0 | 42.0 | 13.5 | Coach = Debit > Pause |
| Debit effort 3 → 4 | 42.0 | 31.5 | 13.5 | Coach leads |
| Debit effort 3 → 2 | 42.0 | 63.0 | 13.5 | Debit leads |
| Coach effort 5 → 7 (LLM and content work) | 30.0 | 42.0 | 13.5 | Debit leads |
| Coach effort 5 → 4 | 52.5 | 42.0 | 13.5 | Coach leads |
| Coach C 7 → 8 | 48.0 | 42.0 | 13.5 | Coach leads |
| Debit I 5 → 6 | 42.0 | 50.4 | 13.5 | Debit leads |
| Debit C 6 → 5 | 42.0 | 35.0 | 13.5 | Coach leads |
| Pause reach = 5.8 (affordability-sized) | 42.0 | 42.0 | 29.0 | Pause still third |
| Pause I 4 → 7, C 5 → 7, E 4 → 3 | 42.0 | 42.0 | 2.7×7×7÷3 = 44.1 | Pause ties for first |

### 7.2 Random perturbation
Impact and Confidence varied by ±2 and Effort by ±1 (uniform choices), 20,000 draws, fixed seed: **Return Coach ranked first in 49.2% of draws, Debit Explainer in 50.1%, Pause and Restart in 0.7%.** This is a rough illustration of judgement uncertainty, not a statistical estimate.

### 7.3 Reading
- **Return Coach and Debit Explainer are statistically indistinguishable on RICE.** Any single plausible change flips the order.
- **Pause and Restart ranks third under almost every reasonable input**, and first only if its Impact and Confidence are both raised sharply, which the evidence (one interview, 1 of 6 changers) does not support today.

---

## 8. Decision

RICE alone does not choose between the first two modules, so the decision uses RICE plus the criteria below.

| Criterion | Return Coach | Debit Explainer | Pause and Restart |
|---|---|---|---|
| Strength of problem evidence | **Strongest** (13/26; 16/26 low confidence; 9/26 top ask) | Strong (11/26; clarity low among affected) | Credible, thin (P02; 4/26; 3/26) |
| Evidence of effect on *actually stopping* | Weak (2/9 vs 1/5 first-year) | **Best descriptive signal** (4/11 vs 1/14) | One documented stop (P02) |
| Risk | **Highest** (advice perception, content, compliance) | Low (deterministic) | Medium (platform capability, reminder pressure) |
| Dependencies | Verified content and sources; band thresholds | Provider reason codes; verified consequence rules | Platform pause-with-date; notification service |
| Effort | 5 days | 3 days | 4 days |
| Evaluation difficulty | High (needs the golden set and eval gate) | Low (unit tests) | Medium |

**Recommended sequence**
1. **Return Coach: first and primary** (the owner's priority and the PRD). Strongest problem evidence and the core of the product; most risk, so it needs the most validation time.
2. **Debit Explainer: built in parallel** after the shared Phase 2 engine, because it is cheap, deterministic, low-risk and has the best descriptive signal on actual change. It can ship earlier if the Coach is delayed by content review.
3. **Pause and Restart: third (P1)**, with its Reach and Impact kept honest; it stays in scope because it covers the only documented real stop and is cheap, but it should not be presented as equal in evidence.

**What would change this decision**
- INDmoney data showing first-year lapses are mostly cash-flow-driven → raise Pause and Restart.
- A usability test where the Coach does not improve comprehension, or reads as advice → hold the Coach and ship the Debit Explainer first.
- Verified payment reason codes making the Explainer richer, or showing most failures are not user-fixable → re-estimate Debit Impact.
- Compliance rejecting "typical at this stage" wording → reduce the Coach to figures and term explanations (lower Impact, lower Effort).

---

## 9. Validation required before relying on any score

| Item | How |
|---|---|
| Real Reach | Cohort counts and trigger rates from INDmoney data (first-year first-time SIPers; share who see a flat or red figure; share with a failed debit; share who pause) |
| Impact | Holdout experiments E1 (Coach), E2 (Debit), E4 (Pause), with the guardrails in the PRD; no claims before results |
| Confidence | Re-rate after 3–4 further interviews with INDmoney first-year investors and the usability tests |
| Effort | Re-estimate after Phase 3 (content and sources are the unknown) |
| Robustness | Repeat §7 with the revised inputs |

## 10. Caveats to carry into any presentation of this table
- Say: "RICE with team estimates for Impact, Confidence and Effort; Reach from a small, mixed-platform survey (N=26)".
- Do not say: "the data show Return Coach has the highest priority." RICE here ties Return Coach and Debit Explainer.
- Do not present Pause and Restart as validated; present it as a problem-level signal with one documented case.
- Interview evidence comes from P01–P05; P00 is contextual only and is not used in this table.
