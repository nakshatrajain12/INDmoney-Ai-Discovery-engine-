# Return band thresholds: owner review pack (D-16)

**Status: PROPOSED. Nothing here is approved.** `src/rules/bands.v1.json` stays `PROPOSED_PENDING_OWNER_REVIEW`, and every threshold in it carries `status: PROPOSED`. These are product-judgement parameters, not research findings, and not investment advice. They reuse the demo values from the clickable prototype and the fixture sanity check; I chose no value from evidence.

All boundary behaviour below was produced by running the real engine (`classify`, `absoluteReturn`), not written by hand. All fixture data behind the examples is DEMO DATA with invented NAVs.

## 1. Every proposed threshold

| # | Key in `bands.v1.json` | Proposed value | What it controls |
|---|---|---|---|
| 1 | `flatBandPct` | 0.50 (percent) | Half-width of the FLAT band around 0.00% |
| 2 | `negativeAtOrBelowPct` | -5.00 (percent) | Where SMALL_NEGATIVE ends and NEGATIVE begins |
| 3 | `positiveAtOrAbovePct` | +5.00 (percent) | Where SMALL_POSITIVE ends and POSITIVE begins |
| 4 | `minInstalmentsForClassification` | 2 | Fewer successful instalments than this gives INSUFFICIENT_DATA, whatever the return |
| 5 | `stageLowerBoundMonths.M1_3` | 1 month | Tenure stage M1 (under 1 month) ends |
| 6 | `stageLowerBoundMonths.M3_6` | 3 months | M1_3 ends |
| 7 | `stageLowerBoundMonths.M6_12` | 6 months | M3_6 ends |
| 8 | `stageLowerBoundMonths.OVER_12` | 12 months | M6_12 ends; also the "annualised from a short period" flag turns off |
| 9 | `shortPeriodXirrBelowMonths` | 12 months | Below this tenure, XIRR is flagged "annualised from a short period" |
| 10 | `providerXirrToleranceBps` | 50 basis points | Gap between our XIRR and the provider's above which `xirrMismatch` is set |

## 2. Classification, intervals and the product explanation attached

Bands compare the **displayed** two-decimal return (D-18, approved), not the unrounded value. "A%" below means that displayed figure.

| Situation | Interval on displayed A% | Product explanation that exists today |
|---|---|---|
| NEGATIVE | A% ≤ -5.00% | `edge-cases.md` RC-E1b "Larger negative": same calm presentation as any negative; no escalation of tone, no warning colour, no urgency; states figures, tenure and what the figure does not mean; does **not** say it will or won't recover. RC-E1c: on tenure over 12 months it uses the over-12 template. |
| SMALL_NEGATIVE | -5.00% < A% ≤ -0.50% | RC-E1a "Small negative": block 2 explains what a small negative at this tenure can and cannot indicate, from approved passages; block 3 says it is not a prediction and not a reason to act either way. Intent for month 3 to 6: early SIP returns sit close to the invested amount and move with the market; how it is calculated. |
| FLAT | -0.50% < A% < +0.50% | RC-E2a/E2b: figures shown; explains why a flat figure is common early and what it does and does not mean. Never label a tiny gain "positive" or a tiny loss "negative". |
| SMALL_POSITIVE | +0.50% ≤ A% < +5.00% | **No separate explanation exists.** `edge-cases.md` has one "Positive" row: what the figure shows, and that a positive figure is not a promise. |
| POSITIVE | A% ≥ +5.00% | Same single "Positive" row as above. |
| INSUFFICIENT_DATA | fewer than 2 successful instalments, or no usable valuation | No explanation of the return. Fixed fallback: RC-E3a (one instalment: "isn't enough history to explain"), RC-E4a (no valuation), RC-E2d (suspect zero value), RC-E2c (nothing invested): not-sure card, no figures interpreted. |

**Important:** none of the explanation *text* is written yet. Phase 3 writes the approved templates and needs a named content owner and compliance reviewer. What exists today is the documented intent in `edge-cases.md` and `user-flow.md`. Across all of them, a flat or negative figure is shown in neutral colour (never coral), with no prediction, urgency or advice.

## 3. Boundary behaviour (run against the real engine, ₹10,000.00 invested, 6 instalments)

| Gain or loss | Exact A% | Displayed A% | Situation |
|---|---|---|---|
| -₹1,000.00 | -10.0000% | -10.00% | NEGATIVE |
| -₹500.00 | -5.0000% | -5.00% | NEGATIVE |
| -₹499.50 | -4.9950% | -5.00% | NEGATIVE |
| -₹499.49 | -4.9949% | -4.99% | SMALL_NEGATIVE |
| -₹50.00 | -0.5000% | -0.50% | SMALL_NEGATIVE |
| -₹49.99 | -0.4999% | -0.50% | SMALL_NEGATIVE |
| -₹49.50 | -0.4950% | -0.50% | SMALL_NEGATIVE |
| -₹49.49 | -0.4949% | -0.49% | FLAT |
| -₹0.01 | -0.0001% | 0.00% | FLAT |
| ₹0.00 | 0.0000% | 0.00% | FLAT |
| +₹0.01 | 0.0001% | 0.00% | FLAT |
| +₹49.49 | 0.4949% | +0.49% | FLAT |
| +₹49.50 | 0.4950% | +0.50% | SMALL_POSITIVE |
| +₹49.99 | 0.4999% | +0.50% | SMALL_POSITIVE |
| +₹50.00 | 0.5000% | +0.50% | SMALL_POSITIVE |
| +₹499.49 | 4.9949% | +4.99% | SMALL_POSITIVE |
| +₹499.50 | 4.9950% | +5.00% | POSITIVE |
| +₹500.00 | 5.0000% | +5.00% | POSITIVE |
| +₹1,000.00 | 10.0000% | +10.00% | POSITIVE |

Rules that follow from this table:
- A figure displayed as exactly ±0.50% is **not** FLAT (it is SMALL_POSITIVE or SMALL_NEGATIVE). A figure displayed as exactly ±5.00% **is** in the outer band (POSITIVE or NEGATIVE).
- Because of displayed-figure rounding, +0.495% to +0.499% already displays +0.50% and is SMALL_POSITIVE; the same applies on the other three edges.
- Rounding is half away from zero (D-17, approved), in integer arithmetic.

Other boundaries:

| Case | Behaviour |
|---|---|
| 1 successful instalment | INSUFFICIENT_DATA whatever the return (e.g. +4.34% with one instalment). With 2, the band applies. |
| Tenure stages | Lower bound inclusive: exactly 1 month after the first successful instalment is M1_3, one day before is M1, one day after is M1_3. Same at 3, 6 and 12 months. Month-end starts clamp (31 Jan + 1 month = 28 Feb, or 29 Feb in a leap year). Tested on, before and after every boundary. |
| Tenure and bands | Tenure does **not** change the return cut-offs. -5% means the same at month 2 and at month 20. Tenure only selects the stage and the short-period XIRR flag. |
| Valuation date differs from as-of date | Treated as unavailable (D-19, approved): no return, no XIRR, INSUFFICIENT_DATA, flag `VALUATION_DATE_MISMATCH`. |
| Current value of zero with money invested | Treated as suspect data: no return, no XIRR, INSUFFICIENT_DATA, flag `VALUATION_SUSPECT`. Never shown as -100%. (See section 5, item 2.) |
| Nothing invested | No A%, INSUFFICIENT_DATA. |
| Provider XIRR | At most 50 bps apart is MATCH (50 inclusive), 51 bps is MISMATCH. If either figure is missing it is NOT_COMPARABLE, not a mismatch. |

## 4. What the proposed values do to the 32 demo SIPs

Illustrative only: the demo returns come from invented NAVs and the 30 personas are designed test cases, not users.

| Situation | Count | SIPs |
|---|---|---|
| POSITIVE | 2 | multi-sip_s1 (+6.71%), paused (+7.65%) |
| SMALL_POSITIVE | 8 | cancelled, long-tenure, missing-xirr (+0.60%), positive, quarterly (+0.75%), restart-pending (+0.71%), short-weekly (+0.76%), xirr-fails (+2.48%) |
| FLAT | 1 | flat-zero (exactly 0.00%) |
| SMALL_NEGATIVE | 18 | early-flat (-2.20%), the 8 debit personas plus cancelled-with-failure, multi-sip_s2 and s3, debit-recovered, cashflow-pause (-4.02%), pause-scheduled (-0.68%), two-instalments, inconsistent-xirr, missing-instalments-gap |
| NEGATIVE | 1 | negative-large (-11.81%) |
| INSUFFICIENT_DATA | 2 | new-month-1 (one instalment), missing-valuation |

Things worth noticing: the persona called `early-flat` is **SMALL_NEGATIVE**, not FLAT; only `flat-zero` is FLAT, so the FLAT template has one demo case. The closest any fixture comes to a cut-off is missing-xirr at +0.60% (0.10 points above the flat edge), so no demo case sits on a boundary (the unit tests do).

## 5. Points that need your decision

1. **Flat edge: inclusive or exclusive.** `architecture.md` section 6.3 and `edge-cases.md` RC-E2b both say FLAT when |A%| ≤ tolerance, which is **inclusive**. My engine treats exactly ±0.50% as **not** flat (strict). That is my deviation from your documents. Options: (A) make the flat band inclusive so ±0.50% is FLAT, matching the documents (a one-line change plus tests; I recommend this, it is also the more conservative reading of "never label a tiny gain positive"); or (B) keep strict and amend the documents. I have not changed it.
2. **Zero value (done, for your information).** RC-E2d requires a zero current value against money invested to be treated as suspect data, not shown as -100%. The engine did not do that; it classified NEGATIVE. I fixed it in this phase (flag `VALUATION_SUSPECT`, value unavailable, INSUFFICIENT_DATA, test added). This is a spec-compliance fix, not a threshold change.
3. **SMALL_POSITIVE versus POSITIVE.** Your documents have a single "Positive" explanation, but `architecture.md` section 6.3 lists both cut-offs. Keep two bands (needs a second template) or merge into one?
4. **Cut-off values 5.00% and 0.50%.** These are my placeholders. Also decide whether the cut-offs should ever depend on tenure; today they do not.
5. **Minimum 2 instalments.** RC-E3a says one instalment gives no explanation, which this matches. RC-E3c says 2 to 3 monthly instalments use a limited-history template with MEDIUM confidence; that confidence input does not exist yet and belongs to Phase 3.
6. **Short-tenure XIRR display guard** (open question 3 in `edge-cases.md`). No value is set, so XIRR is only flagged, never suppressed. Demo examples that look extreme: short-weekly +23.55%, negative-large -44.68%, new-month-1 -17.80%. Decide whether to set a guard (and its value) or show the flagged figure only in the term sheet.
7. **Provider XIRR tolerance 50 bps.** Placeholder.
8. **Stale valuation versus RC-E4b.** `edge-cases.md` RC-E4b says a stale valuation is shown with its as-of date at MEDIUM confidence. Your D-19 (approved) says treat it as unavailable. D-19 governs the code. I have not edited `edge-cases.md`; say if you want RC-E4b amended.

Until you answer, `bands.v1.json` stays PROPOSED and Phase 3 should not rely on these values as final.
