# Problem Statement: SIP Steady (Return Coach, Debit Explainer, Pause and Restart)

**Labels used throughout**
- **[F] Fact:** measured in our data or taken from a cited public source.
- **[H] Hypothesis:** a testable belief the evidence supports but does not prove.
- **[A] Assumption:** something we are taking as true to proceed; needs confirming.

**Sources:** `survey_clean_anonymized.csv` (N=26, all platforms), interview records P00–P05, `FINAL_SIP_RESEARCH_REPORT.md`, `hypothesis_validation_register_16.csv`, AI Discovery Engine repository (3,079 clean signals), the deck `NL_INDmoney Solution.pptx`, and public statistics checked on 2026-11-08. Survey figures below are recomputed from the CSV.

---

## 1. Business context

- **[F]** INDmoney reports 10M+ investors (indmoney.com/about, company-reported). It offers direct mutual funds only, with zero commission, and SIPs run through INDpay UPI and are managed in the SIP Centre (indmoney.com/mutual-funds).
- **[F]** Industry SIP inflow hit a record ₹32,490 Cr in September 2026 (AMFI, via Angel One).
- **[F]** The industry SIP stoppage ratio was 78.5% in September 2026: 49.68 lakh SIPs discontinued or completed against 63.26 lakh new registrations. It includes SIPs that simply finished their tenure, so it is **not** the share of investors who quit.
- **[F]** Industry-wide, 19.9% of direct-plan SIP assets are held 5+ years vs 34.4% for regular plans (AMFI-Crisil, Mar 2026). This is asset-weighted and industry-wide; direct plans are also a faster-growing base, so it does not measure INDmoney's retention.
- **[F]** Groww, Zerodha Coin and INDmoney all sell zero-commission direct plans.
- **[A]** Because starting a SIP is easy to copy, keeping it going is where INDmoney can differentiate.
- **[F, gap]** INDmoney does not publish SIP retention. We have **no** INDmoney retention figure; the size of the retention problem at INDmoney is unknown until measured from internal data.

## 2. User problem

> Investors can see what happened to their SIP, but not what it means or what to do next.

Three observed forms:

1. **Interpreting a flat or red return.** The app shows a figure with no yardstick for "normal at my stage".
   - **[F]** 11/26 were unsure whether their returns were normal; 11/26 found performance terms confusing; 13/26 reported at least one of the two; 16/26 rated their confidence in understanding SIP metrics 1–3 of 5.
   - **[F]** 9/26 chose "clearer return or volatility explanations" as the single most valuable change.
2. **Acting on a failed debit.** A "failed" notice does not say why, whether the SIP is still active, or what to do.
   - **[F]** 11/26 reported a payment or mandate issue (6 once, 5 more than once); 4 of those 11 rated the clarity of reason and next steps 1–2 of 5; 7/26 chose payment-failure recovery or upcoming-debit visibility as most valuable.
   - **[F]** Interview P03: a UPI daily-limit failure with a generic notice. (P00, the researcher-user's own account, also reports a failed debit; it is context only, not independent evidence.)
3. **Pausing with no way back.** After a cash-flow shock, pause, reduce and cancel are unclear and nothing prompts a restart.
   - **[F]** Interview P02 paused a ₹5,000 SIP after income fell, was unsure what pause does, and had not restarted three months later.
   - **[F]** 15/26 sized their SIP by monthly affordability; 4/26 named an income drop or unexpected expense as the main reason for considering a change; 3/26 chose easier pause or edit controls.

**Workaround [F]:** 25/26 selected at least one help source (friends or family 11, Google 10, investment app 8, YouTube 7, Reddit or forums 7, adviser 6, influencers 4, AMC site 3). Interviews P01 and P05 describe conflicting advice online; outside help also reassured P05.

**Not the problem [F]:** this is not simply "investors stop when markets fall". 12/26 continue as usual when returns are flat or red; 1/26 pauses or stops first; 9/26 never considered changing their SIP.

## 3. Target segment

**Selected segment: Uncertain Newcomers** (rule-based archetype, **not** a statistical cluster).
- **Definition [F]:** first-ever mutual fund investment, SIP tenure of 12 months or less, and selected "unsure if returns were normal" or "confusing performance terms".
- **Size [F]:** 9/26 respondents (9 of the 14 first-time investors in their first year).
- **Behaviour [F]:**
  - 7/9 expected quick positive returns.
  - 8/9 rated confidence in SIP metrics 1–3.
  - 7/9 are in months 3–6 of their SIP.
  - 4/9 check daily or more.
  - 8/9 considered pausing, reducing or stopping; 2/9 did (one stopped, one paused).
  - 3/9 had a payment or mandate issue, including both who changed course.
- **Platform mix [F]:** 4 INDmoney, 5 Groww. INDmoney-only evidence is therefore thin (n=4); this segment's survey evidence is mixed-platform.
- **Interviews [F]:** P01 (INDmoney, ~5 months) is in the segment; P05 (Groww, ~5 months) is a comparison case, not an INDmoney user.

**Adjacent groups served by the other two scope items**
- *Debit-disrupted* (11/26 with a payment issue, 5 on INDmoney): P03.
- *Cash-flow-constrained* (4/26 with a cash-flow reason): P02.

**Disconfirming evidence [F]:** P04 (INDmoney, ~10 months) continued through a dip with no outside help, a goal and a salary-aligned date. R08 and R12 in the 3–6-month group, both confused, did not change. Confused first-time investors in their first year changed course at 2/9 vs 1/5 for those not confused: no clear separation.

## 4. Jobs to be done

*Our synthesis from the research, not participant statements.*

1. **[H]** When my return turns flat or red, I want to know whether that is normal at my stage, so I can stay on my plan without second-guessing.
2. **[H]** When a debit fails, I want the reason, whether my SIP is still active and one next step, so I keep trusting the app.
3. **[H]** When my income changes, I want to pause or reduce my SIP without losing the plan, and be reminded when I choose to resume, so a short break does not become a permanent lapse.

*Participant words that motivated them [F]:* P01, "Tell me if this is normal for five months. Not advice, just what usually happens." P03, "It told me it failed. It didn't tell me why or what to do." P02, "A clear explanation of what pause does. A nudge to resume."

## 5. Supporting evidence

| Evidence | Finding | Denominator | Type | Limit |
|---|---|---|---|---|
| Return confusion | 13/26 unsure or confused; 16/26 confidence 1–3 | Survey N=26 | [F] | Self-reported, mixed platform |
| Early expectations | 12/26 expected quick positive returns; 7/7 in the 3–6-month cohort | N=26; n=7 | [F] | Small cohort; includes 2 rows mirroring interviews |
| Payment friction | 11/26 had an issue; considered a change 8/11 vs 8/14; changed 4/11 vs 1/14 | N=26 | [F] | Descriptive; Fisher p≈0.13; not causal |
| Considering vs changing | 17/26 considered; 6/26 changed | N=26 | [F] | Consideration is not churn |
| Cash-flow and pause | 4/26 cash-flow reason; 1 of the 6 who changed; P02 | N=26; interview | [F] | One case drives the mechanism |
| Public reviews | Information clarity and red-number anxiety are the two largest themes; payment friction is smaller | 3,079 signals, 36% INDmoney | [F] | Discovery only: not prevalence or timing; 97.8% of signals have unknown SIP tenure |
| Interviews | P01–P05 as above (P00 is contextual only, not independent) | 5 cases | [F] | Condensed records; only P01 (and P05) in the segment |

**Data-integrity notes [F]:** five survey rows (R22–R26) closely mirror interviews P01–P05, so the interview cases are partly double-counted at N=26. Results should be shown with a sensitivity view at N=21. One respondent's consent was changed from No to Yes in the workbook and the platform field of three rows was edited; these need documenting.

## 6. Product opportunity

**Scope (selected):**
1. **Return Coach:** a plain-language, tenure-aware reading of the user's own figure, descriptive and cited, never advice.
2. **Rules-based Debit Explainer:** reason, SIP status and next step for a failed debit, from a rules table (no LLM required).
3. **Pause and Restart controls:** clear meaning of pause, reduce and cancel; pause with a return date; opt-in restart reminder.

**Why this scope**
- **[F]** Return confusion has the strongest direct survey support; payment friction is the most common operational issue; cash-flow pause is the only fully documented actual stop in interviews (P02).
- **[H]** Explaining what a return means at this stage reduces pause or cancel after a flat or red figure.
- **[H]** A failed-debit message with reason, status and next step raises recovery within 7 days.
- **[H]** A pause with a return date and opt-in restart prompt raises reactivation.
- **[A]** The Debit Explainer and restart prompt can ship without an LLM; AI is justified only for the Return Coach and free-text input, and only once it passes an eval gate.

**Not proven [F]:** none of the three interventions has been tested for effect on retention. The research validates problem signals, not feature-level lift or causality.

## 7. Business objective

- **Strategic goal (from the brief) [F]:** increase the percentage of first-time mutual fund investors who still have an active SIP 12 months after starting their first one. *Active* = at least one successful instalment in the last 30 days.
- **North Star Metric:** 12-month active SIP rate for the first-time-investor cohort.
- **Proposed decomposition [H]:** `A₁₂ = S + (1 − S) × r`, where S = s₁ × s₂ × s₃ × s₄ (conditional survival through first instalment, autopay holding, months 3–6, months 6–12) and r = share of lapsed users active again by month 12. Every term is **to be instrumented**; no baseline is known.
- **Definition issues to resolve [A]:** the cohort rule for "first-time" (including outside holdings INDmoney can detect), handling of daily, weekly and quarterly SIPs, and exclusion of fixed-tenure SIPs that completed before month 12.

## 8. Constraints

- **Brief [F]:** no specific fund or stock recommendations; no fear, FOMO or urgency-based nudges.
- **Not investment advice [F, rule]:** no "continue, stop or buy"; "typical at this stage" statements are descriptive, cited and never predictions; a visible "not advice" label; safe fallback ("not sure" plus an official source).
- **Reminders [A]:** user-set and calm, never urgency.
- **Privacy [F, rule]:** no account numbers, PAN or portfolio screenshots collected from respondents; research data anonymised.
- **Evidence [F]:** survey and interviews are small, non-probability and mixed-platform; do not present results as INDmoney prevalence. Engine scores and corpus shares are not prevalence or churn.
- **Data access [A]:** the MVP can read the user's own figure and debit status only as provided or simulated; production data access, rules-table sourcing (AMC, AMFI, bank and RBI e-mandate rules) and compliance review are not yet established.
- **Delivery [F, brief]:** a deployed, eval-gated MVP with a visible quality check, tested with at least 3 users from the target segment.

## 9. Success definition

*All targets are proposed. No baselines exist; they must be measured first.*

- **North Star:** 12-month active SIP rate, first-time cohort (lagging).
- **Primary proxy for the MVP [H]:** 90-day continuation among exposed first-year users compared with a holdout; pause or cancel within 30 days of a flat or red figure.
- **Leading indicators:** comprehension check (at least 2 of 3 correct), failed-debit resolved within 7 days, paused SIPs reactivated within 60 days, opt-in rate for debit reminders.
- **Guardrails:** advice-refusal compliance 100% on audited samples; "felt like advice" feedback near zero; no rise in cancellations, complaints, support contacts or notification opt-outs.
- **AI quality gate (proposed):** at least 95% correct on rule questions, 100% refusal of advice prompts, 0 invented fees or limits, on a new golden set of about 40 hand-labelled scenarios (not yet built).
- **Prototype test:** at least 3 first-year INDmoney users complete a real task; report observed results as they are.

## 10. Open questions and next evidence

1. INDmoney's actual first-year SIP retention by cohort and by month (needs internal data).
2. Whether confusion causes stopping (current counts are too small to say).
3. Whether payment failure causes lapse (4/11 vs 1/14 is descriptive).
4. Additional interviews with INDmoney first-year investors who have seen a flat or red figure.
5. Provenance and independence of R22–R26 and of P01–P05 (real, condensed or adapted).
6. Legal and compliance read of "typical at this stage" wording.
