# 08 MVP Specification: Pre-debit SIP Check-in

**Owner:** Product Strategy | **Date:** 2026-11-02 | **Status:** Draft for review
**Decision source:** `07_solution_decision.md` (S2 selected) | **Problem:** `06_problem_definition.md` rev. 2

> **Evidence standing.** Built on P00 (real, n = 1), SIM-P01 to SIM-P05 (simulated, mock study) and public reviews. No INDmoney product data was available; every product rule marked **(verify)** depends on current INDmoney, AMC/RTA, bank or NPCI behaviour that has not been checked.

---

## 1. Summary

Before each scheduled SIP debit, INDmoney sends one calm, optional check-in. If the instalment still works, the user does nothing. If it doesn't, they can **skip this month**, **lower this month**, **move the date**, or **pause with a resume date**, each with a plain statement of what happens next. If a debit fails anyway, the user gets the reason, the SIP's status and the next step.

**Goal:** fewer debit-date collisions ending in failure or cancellation, and fewer pauses that never resume, among first-time SIP investors. That supports the North Star of SIPs active at month 12.

---

## 2. Goals and non-goals

| Goals | Non-goals |
|:---|:---|
| Give users a choice before a debit that might not fit | Recommending funds, amounts, or whether to invest |
| Replace "fail or cancel" with lighter options | Predicting balances or reading bank data (no Account Aggregator in MVP) |
| Bring paused SIPs back on a date the user chose | Any AI or LLM component (see §11) |
| Explain failed debits clearly | Changing bank or UPI charges (outside INDmoney's control) |
| Keep stopping exactly as easy as today | Discouraging a legitimate stop |
| | Tax or charges statements (opportunity E; deferred) |

---

## 3. Users and eligibility

- **Primary:** first-time SIP investors on INDmoney in their first 12 months.
- **Eligible SIPs:** all active mutual-fund SIPs paid by auto-debit (UPI AutoPay or NACH). US-stock SIPs are out of scope for the MVP.
- **Multiple SIPs on the same date** are combined into **one** check-in listing each SIP and the total (P00 ran three SIPs).
- **Default:** on for new first-time investors in the treatment group; off-switch always visible.

---

## 4. Product principles (non-negotiable)

1. **No advice.** Never suggest a fund, stock, amount, or whether to continue. Options are listed; the user chooses.
2. **No fear, FOMO or urgency.** No countdowns, alarms, red warnings, "don't miss out", loss framing, or market commentary. One message per debit.
3. **Doing nothing is the default.** The message must say so.
4. **Stopping stays easy.** "Stop this SIP" is visible on every options screen, with no extra steps compared with today and no retention interstitial.
5. **Factual, sourced, optional** (from P00). State only what the system knows; say what it doesn't know (e.g. "your bank may apply its own charge").
6. **Neutral option order.** Options are listed in a fixed order, with no option visually emphasised over another except "Keep as planned" as the no-action default.

---

## 5. Scope

| In MVP | Later / out |
|:---|:---|
| F1 Pre-debit check-in (push + in-app card) | SMS, email, WhatsApp channels |
| F2 One-tap actions: keep, skip this month, lower this month, move date, pause with resume date, stop | Permanent amount change from the check-in (available today in SIP settings; verify) |
| F3 Failure explainer | Retry payment in-app (only if rails support it; verify) |
| F4 Pause with resume date + one resume reminder | Predictive targeting |
| F5 Preferences (timing, channel, off) | "Ask about my SIP" assistant (phase 2, §11) |
| F6 Repeat-skip card (rule-based) | Goal tracking |

---

## 6. User flows

### F1 Pre-debit check-in
- **Trigger:** a scheduled debit, at the user's chosen lead time (default **one day**, per P00; options: 1 day, 2 days, 3 days, off).
- **Content:** amount, date, SIP name(s), payment method, and the line "If this still works, there's nothing to do."
- **Actions:** "Keep as planned" (dismiss) | "See options" (opens F2).
- **Frequency cap:** one check-in per debit date. No follow-up reminder if unopened.
- **Coexistence (verify):** if the bank or UPI app already sends its own pre-debit message, keep ours clearly INDmoney-branded and focused on options, not duplicated notice.

### F2 Options for this instalment
Fixed order, each with a one-line consequence statement (copy in §7):

| Option | What it does | Rules (verify) |
|:---|:---|:---|
| Keep as planned | Nothing changes | Default |
| Skip this month | This instalment is not collected; the SIP stays active | Allowed only if the AMC/RTA supports skips; cap per 12 months per scheme rules |
| Lower this month | Collects a smaller amount this month only; next month returns to the usual amount | Must be at or above the scheme minimum; user types the amount, with no suggested value |
| Move the date | Moves this and future debits to a new day of the month | Subject to mandate rules; show the new next-debit date |
| Pause | Pauses the SIP until a resume month the user picks | Resume month required; show what happens to the mandate |
| Stop this SIP | Existing stop flow, unchanged | Same steps as today |

After any change: a confirmation that states the new next-debit date and amount.

### F3 Failure explainer (also shipped to all users as hygiene)
- **Trigger:** debit failure status received.
- **Content:** plain-language reason (mapped from the rail's reason code), whether the SIP is still active, the next scheduled debit, and the statement "Your bank may apply its own charge for a failed debit. Check with your bank." No fee amount is stated unless INDmoney knows it.
- **Actions:** "Leave it, continue next month" | "Change upcoming instalments" (opens F2) | "Pay this instalment now" (only if supported; verify).
- **Unknown reason:** say "Your bank didn't share a reason" rather than guessing.

### F4 Pause with resume date
- Pause requires a resume month (1-3 months ahead; verify scheme limits).
- **Resume reminder:** one message a few days before the resume date: "Your SIP is set to restart on [date]. Nothing to do if that still works." Options: keep, extend the pause once, stop.
- If the user extends twice, show F6 instead of further reminders.

### F5 Preferences
- Under SIP settings: check-in timing (1/2/3 days, off), channel (push, in-app), and per-SIP opt-out. Changes take effect from the next debit.

### F6 Repeat-skip card (rule-based)
- **Trigger:** a second skip, lower or pause extension within three months.
- **Content (neutral):** "You've changed this SIP a few times recently. If the usual amount or date no longer fits, you can change it in SIP settings. If it still works, there's nothing to do." Dismissible; shown at most once per three months.

---

## 7. Content design

**Tone:** plain, calm, second person, short sentences. Placeholders in [brackets].

| Moment | Example copy |
|:---|:---|
| Check-in | "Your SIP of [amount] is scheduled for [date]. If that still works, there's nothing to do. Need a change this month? See options." |
| Skip consequence | "This month's [amount] won't be collected. Your SIP stays active and the next instalment is on [date]." |
| Lower consequence | "We'll collect [new amount] on [date]. From [next date] it goes back to [usual amount]." |
| Pause consequence | "No instalments until [resume month]. Your mandate [stays registered / details per rules — verify]. We'll remind you a few days before it restarts." |
| Failure | "Your [SIP name] instalment on [date] didn't go through. Reason from your bank: [reason]. Your SIP is still active; the next instalment is on [date]. Your bank may apply its own charge for a failed debit. Check with your bank." |

**Banned in all copy:** "hurry", "last chance", "don't miss", "you'll lose", "act now", countdown timers, market-performance references, past-returns claims, any fund name as a suggestion, "recommended amount", red alert styling.

**Copy review:** every string checked by compliance for advice and by a content designer for urgency before release.

---

## 8. Business rules and edge cases

| Case | Behaviour |
|:---|:---|
| Several SIPs on one date | One combined check-in; options per SIP |
| Daily or weekly SIP | No check-in (too frequent); F3 and F4 still apply |
| First-ever instalment | Check-in includes "This is your first instalment"; no skip offered (verify) |
| Mandate expired or not yet active | Check-in replaced by a neutral mandate-status message with a link to fix it |
| Scheme doesn't support skip/lower/date change | Option hidden, with a single line "Not available for this fund"; no workaround suggested |
| User already changed this instalment | No check-in for that debit |
| Check-in tapped after the debit was processed | Show the actual status instead of options |
| Unknown failure reason | Say so; don't guess |
| User opted out | No check-ins; F3 still applies |

---

## 9. Measurement

### 9.1 North Star (definition proposed, to be agreed)
**Share of first-time SIP investors whose first SIP is active at month 12.**
Proposed definition: *not cancelled, and at least one successful instalment in the last two scheduled cycles.* A SIP paused with a scheduled resume date within 60 days is reported separately as "active-paused". Skips and one-month reductions don't break "active". **Stakeholders must confirm this before launch** (`06` §8).

### 9.2 Leading indicators

| Metric | Definition |
|:---|:---|
| Collision resolution | Of check-ins where the user took an action, share choosing skip/lower/move/pause rather than stop |
| Insufficient-balance failures | Failed debits with an insufficient-balance reason per 100 scheduled debits |
| Pause-to-resume rate | Share of pauses that resume on or before the chosen date |
| Time paused | Median days paused |
| Failure recovery | Share of users with a failed debit whose next scheduled debit succeeds |

### 9.3 Guardrails

| Guardrail | Alert threshold to be set from baseline |
|:---|:---|
| Check-in opt-out rate | Rising trend after launch |
| Stop-flow completion | Must not fall vs control (stopping stays easy) |
| Complaints or ratings mentioning reminders/notifications | Rising trend |
| Repeat skips becoming permanent pauses | Rising share |
| Advice/urgency content | Zero, by copy audit |

### 9.4 Events
`checkin_sent`, `checkin_opened`, `option_viewed`, `action_selected{keep|skip|lower|move|pause|stop}`, `change_confirmed`, `debit_result{success|fail:reason}`, `failure_explainer_viewed`, `resume_reminder_sent`, `sip_resumed`, `pause_extended`, `checkin_opt_out`, `repeat_skip_card_shown`.

---

## 10. Experiment and rollout

| Phase | Scope | Exit criteria |
|:---|:---|:---|
| 0. Verify | Answer the **(verify)** items; get baselines; agree the North Star definition | All dependencies confirmed |
| 1. Internal | Employees and opted-in beta users | No incorrect consequence copy; events firing |
| 2. Experiment | First-time SIP investors randomised at user level: check-in + options vs current experience. **Failure explainer (F3) ships to both arms** as hygiene | Leading-indicator readout at about 90 days; guardrails within thresholds |
| 3. Expand | All SIP investors, keeping a small long-term holdout for the month-12 read | Month-12 North Star read on the holdout |

- **Sample size:** set from the baseline active-at-12-months rate and a minimum detectable effect agreed in phase 0; no figure is assumed here.
- **Stop rule:** pause the experiment if a guardrail breaches its threshold.
- **Usability test before phase 2:** at least three users complete five tasks: read the check-in; skip this month; lower this month; explain in their own words what pause does; read a failure explainer and state whether the SIP is active. Pass = every participant states the SIP's status correctly after each task.

---

## 11. AI: not in the MVP

**Why not:** all MVP behaviour is deterministic (scheduled dates, a fixed option set, enumerable failure codes), so templates are exact and auditable. A generative model could misstate a mandate rule or drift into advice, and P00 asked for factual, sourced explanations.

**Phase-2 candidate: "Ask about my SIP" (grounded assistant).**
**Gate to build:** MVP data shows a meaningful volume of questions after check-ins or failures that templates and help articles don't answer (measured by help searches and support contacts on these topics).
**Guardrails if built:**
- Answers only from the user's own SIP data and published scheme and mandate rules, with sources shown.
- Refuses advice (funds, amounts, whether to invest), with an evaluation set of advice-seeking prompts and a target refusal rate.
- States uncertainty ("I don't have that information").
- Optional and on demand only; never proactive.
- Human-reviewed evaluation before launch; logging for audit.

---

## 12. Dependencies, risks and open questions

| Dependency | Owner | Status |
|:---|:---|:---|
| Skip, one-month lower, date change, pause-with-resume support per scheme | Payments / MF ops, AMCs/RTAs | **Verify** |
| Failure reason codes from UPI AutoPay and NACH | Payments | **Verify** |
| Bank/UPI pre-debit notifications already sent | Payments | **Verify** |
| Notification scheduler and preference centre | Platform | Assumed available (verify) |
| Copy compliance review | Compliance | Required |

| Risk | Mitigation |
|:---|:---|
| Notification fatigue | One message per debit; configurable or off; monitor opt-outs |
| Users read options as encouragement to skip | Neutral copy; "nothing to do" default; F6 cap |
| Copy states a wrong consequence | Consequence text driven by actual scheme rules; QA per scheme type |
| Skips become permanent | F4 resume date, F6 card; track as a guardrail |
| Evidence base is thin (one real interview; simulated interviews) | Phase 0 baselines and phase 2 experiment decide; pivot to B per `06` §8 if pauses/cancellations are rare |

**Open questions**
1. Which options do AMCs/RTAs support for the schemes first-time investors use most?
2. How should check-ins behave for SIPs with a step-up scheduled?
3. Should the check-in be suppressed for users who have never changed or failed an instalment after N months?

---

## 13. Acceptance criteria (MVP)

1. Check-in sent once per eligible debit at the chosen lead time, combining SIPs on the same date.
2. Every option shows the correct next-debit date and amount after the change, consistent with scheme rules.
3. "Stop this SIP" is reachable from the options screen with no added steps.
4. Unsupported options are hidden with one neutral explanatory line.
5. Failure explainer shows reason (or "not shared"), SIP status and next debit; no fee amount unless known.
6. Pause cannot be set without a resume month; one resume reminder is sent.
7. Copy passes compliance (no advice) and content review (no urgency, fear or FOMO); banned-term check passes.
8. All §9.4 events fire with correct properties.
9. Preference changes apply from the next debit.
