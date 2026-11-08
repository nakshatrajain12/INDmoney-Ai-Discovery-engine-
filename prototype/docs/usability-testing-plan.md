# Moderated Usability Testing Plan: SIP Steady Prototype

**Document Status:** Study Protocol & Operational Guide (Completed — Findings documented in [`docs/usability-findings-report.md`](usability-findings-report.md))  
**Version:** 2.0.0 (Executed Protocol & Findings Summary)  
**Target Prototype:** INDmoney SIP Confidence & Recovery Prototype (`SIP Steady`)  
**Methodology:** Moderated Formative Usability Testing with Concurrent Think-Aloud (CTA)  
**Sample Size:** Small formative cohort ($N = 5 \text{ to } 8$ participants)  
**Session Duration:** 45 minutes per participant (Remote via Video Call with Mobile Screen Share)  
**Dependencies:**
- [`docs/detailed-rice.md`](detailed-rice.md)
- [`docs/user-flow.md`](user-flow.md)
- [`docs/archive/mvp-original/architecture.md`](archive/mvp-original/architecture.md)

---

## 1. Executive Summary & Study Protocol

This document establishes the formal research protocol for a moderated, formative usability study of the **INDmoney SIP Confidence and Recovery prototype**. The study evaluates the behavioral ergonomics, cognitive clarity, and regulatory safety of three core product interventions designed to prevent early-stage first-year SIP abandonment:
1. **Module 1: Return Coach** (Tenure-aware performance reassurance and metric literacy).
2. **Module 2: Rules-Based Debit Explainer** (Plain-language triage of failed auto-debits and mandate continuity).
3. **Module 3: Pause and Restart Controls** (Transparent cash-flow adjustment with opt-in restart reminders).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PROTOCOL INTEGRITY RULES                               │
├──────────────────────────────┬──────────────────────────────┬──────────────────────────┤
│ 1. ZERO INVENTED DATA        │ 2. SEPARATE FROM QUANTITATIVE│ 3. STRICT COMPLIANCE GATE│
│ • No synthetic user quotes   │ • Usability measures task    │ • Zero tolerance for     │
│ • No fabricated SUS scores   │   clarity, not churn delta   │   perceived investment   │
│ • Clean, un-run logging      │ • Retention lift requires    │   advice (SEBI RIA       │
│   templates for real testing │   production A/B holdouts    │   boundary monitoring)   │
└──────────────────────────────┴──────────────────────────────┴──────────────────────────┘
```

> [!IMPORTANT]
> **Separation of Usability from Quantitative Validation:**  
> This usability study does **not** measure or claim statistical retention lift, cohort survival probabilities, or market-wide prevalence. Usability testing evaluates whether real human investors can navigate the interface, comprehend financial terms, and successfully execute recovery actions without experiencing panic or mistaking factual explanations for investment advice.

---

## 2. Research Objectives & Core Questions

The primary objective is to evaluate whether first-time mutual fund investors, specifically **Uncertain Newcomers**, can independently understand early portfolio fluctuations, resolve auto-debit glitches, and manage cash-flow adjustments without moderator assistance or regulatory confusion.

### Specific Research Questions (RQs)

```
                     ┌──────────────────────────────────────────────┐
                     │          CORE RESEARCH QUESTIONS (RQs)       │
                     └──────────────────────┬───────────────────────┘
                                            │
         ┌──────────────────┬───────────────┴──────────────┬──────────────────┐
         ▼                  ▼                              ▼                  ▼
  [RQ1: Volatility]  [RQ2: Literacy]                [RQ3: Payment]     [RQ4: Control]
  Can users read     Do users grasp                 Do users know      Can users set
  -2% without panic  XIRR vs Abs %                  if SIP is active   dates and calm
  or calling it      using the                      after an auto-     reminders
  financial advice?  Term Sheet?                    debit failure?     without guilt?
```

* **RQ1 (Volatility Reassurance):** When an investor sees a negative return (e.g. Month 5, $-2.1\%$), does the Return Coach communicate that this is typical early-stage behavior without misleading them or giving illegal financial recommendations?
* **RQ2 (Metric Comprehension):** Can users locate, open, and articulate the definition of complex metrics (`XIRR` vs `Absolute Return`) using the on-demand Term Sheet?
* **RQ3 (Debit Diagnostic & Status):** When a payment fails, do users immediately understand *why* it failed, and crucially, do they understand that their *underlying SIP mandate is still active*?
* **RQ4 (Recovery Actionability):** Can users discover and complete the 1-tap manual retry flow without hesitation or fear of double-debiting?
* **RQ5 (Cash-Flow Flexibility & Reminders):** When facing a liquidity squeeze, do users understand the difference between *Pause vs Reduce vs Cancel*, and can they successfully schedule a pause with an opt-in restart reminder?
* **RQ6 (Compliance & Trust):** Does any part of the experience create the impression that INDmoney is advising the user to hold, sell, pause, or switch funds?

---

## 3. Participant Screening & Recruitment

### 3.1 Target Cohort: "Uncertain Newcomers"
Per the research context, the study focuses on the **Uncertain Newcomers** archetype—first-time mutual fund investors in their first 12 months who experience anxiety over flat/negative returns and payment friction.

### 3.2 Cohort Sizing ($N = 5 \text{ to } 8$)
Per established usability engineering benchmarks (Nielsen Norman Group), a sample of $5 \text{ to } 8$ participants is optimal for a formative study, uncovering $\ge 85\%$ of usability flaws, comprehension blockers, and navigation bottlenecks before production code deployment.

### 3.3 Participant Screening Screener

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              PARTICIPANT SCREENER MATRIX                               │
├─────────────────────────────────────┬──────────────────────────────────────────────────┤
│ CRITERION                           │ SCREENING RULE & QUALIFYING RESPONSES            │
├─────────────────────────────────────┼──────────────────────────────────────────────────┤
│ 1. Mutual Fund SIP Experience       │ • "Started first-ever MF SIP within last 12 mo"  │
│                                     │ • Disqualify: Seasoned investors (> 2 yr SIP)    │
├─────────────────────────────────────┼──────────────────────────────────────────────────┤
│ 2. Platform Usage                   │ • Active user of INDmoney, Groww, Zerodha Coin,  │
│                                     │   or PayU/bank direct mutual fund apps           │
├─────────────────────────────────────┼──────────────────────────────────────────────────┤
│ 3. Return Confidence Level          │ • Self-reported confidence understanding returns │
│                                     │   rated 1, 2, or 3 on a 5-point scale            │
├─────────────────────────────────────┼──────────────────────────────────────────────────┤
│ 4. Behavioral Friction Encountered  │ • Must meet at least ONE:                        │
│                                     │   a) Felt confused/anxious over flat or -ve SIP  │
│                                     │   b) Experienced an auto-debit/mandate failure   │
│                                     │   c) Considered pausing/reducing due to budget   │
├─────────────────────────────────────┼──────────────────────────────────────────────────┤
│ 5. Regulatory / Professional Bias   │ • Disqualify: Financial advisors, SEBI brokers,  │
│                                     │   fintech product managers, or UI/UX designers   │
└─────────────────────────────────────┴──────────────────────────────────────────────────┘
```

### 3.4 Target Participant Roster ($N=6$ Target Cohort)

| Participant ID | Target Persona | Tenure | Primary Friction Profile | Platform Used |
|:---:|:---|:---:|:---|:---:|
| **P-01** | Early Flat / Negative | Month 3–5 | Checked weekly; anxious over $-2\%$ loss; Googled XIRR | INDmoney |
| **P-02** | Debit Failure (UPI Limit) | Month 2–4 | Failed debit due to bank UPI daily limit; unsure of status | INDmoney |
| **P-03** | Cash-Flow Strain (Variable) | Month 6–8 | Freelancer; paused once without setting a resume date | Groww |
| **P-04** | Terminology Confused | Month 4–6 | Unsure how Absolute % differs from annualized XIRR | Zerodha Coin |
| **P-05** | Debit Failure (Balance) | Month 1–3 | Missed debit due to weekend balance deficit; feared penalty | INDmoney |
| **P-06** | Goal-Oriented Newcomer | Month 5–7 | Investing ₹2,000/mo; considered stopping after sideways NAV | Groww |

---

## 4. Moderator Script & Facilitation Protocol

The session follows a non-directive, semi-structured facilitation protocol utilizing Concurrent Think-Aloud (CTA). The moderator never guides the user toward specific UI controls or corrects their misconceptions during a task.

### 4.1 Phase 1: Welcome, Rapport & Framing (5 Minutes)

> *"Hello [Participant Name], thank you so much for joining us today! My name is [Moderator Name], and I'm a researcher working on making investment tools easier to understand.*
> 
> *Before we start, I want to emphasize a few important things:*
> 1. *We are testing the prototype, **we are not testing you**. You cannot make any mistakes today. If anything is confusing or hard to find, that is 100% the fault of the design, and finding those exact issues is how we fix them.*
> 2. *We will be looking at an early interactive prototype using mock investment data. None of your real accounts or money will be involved.*
> 3. *As you go through the screens, I'd like you to **think out loud**. Tell me what you are looking at, what you expect to happen when you click something, and what questions come to your mind.*
> 4. *I might be quiet at times while you explore. I'm not ignoring you—I'm just observing your natural reactions. If you get stuck, that's completely fine; just tell me what you're trying to do.*
> 
> *We have about 45 minutes today. Do you have any questions for me before we begin? With your permission, I will start the recording now."*

### 4.2 Phase 2: Pre-Task Context Interview (5 Minutes)

1. *"How long have you been investing in mutual funds through a monthly SIP?"*
2. *"When was the last time you opened your investment app, and what was the main thing you checked?"*
3. *"Have you ever opened your app and seen a return number that was negative or confusing? How did that make you feel, and what did you do?"*
4. *"Have you ever had an auto-debit or payment fail for a SIP? What happened next?"*

---

## 5. Detailed Task Instructions, Success & Failure Criteria

The study evaluates **six realistic, scenario-based tasks**. Tasks are administered in sequential order without leading cues.

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       TASK SEQUENCE OVERVIEW                                          │
├───────────────────────────────────────────────────┬───────────────────────────────────────────────────┤
│ TASK 1: Understand Negative Returns               │ TASK 2: Explain What XIRR Means                   │
│ [Module 1: Return Coach Hero & 3-Block Narrative] │ [Module 1: Term Sheet Bottom Sheet Modal]         │
├───────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ TASK 3: Diagnose Failed Instalment                │ TASK 4: Determine If SIP Is Still Active          │
│ [Module 2: Debit Explainer Plain Reason Card]     │ [Module 2: Status Chip & Mandate Continuity Card] │
├───────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ TASK 5: Pause SIP Until Selected Date             │ TASK 6: Enable Restart Reminder                   │
│ [Module 3: Options Matrix & Pause Scheduler]      │ [Module 3: Opt-In Notification Checkbox]          │
└───────────────────────────────────────────────────┴───────────────────────────────────────────────────┘
```

---

### Task 1: Understand Why a SIP is Showing Negative Returns

#### Scenario & Moderator Prompt
> *"Imagine you started investing ₹2,500 every month into an equity mutual fund 5 months ago. You open your app today to check on your investment, and you see that your returns are showing negative. Take a look at the screen and see if you can find out what is happening and what this means."*

#### Behavioral Task Flow
Dashboard (`/sips`) $\longrightarrow$ Select SIP (`/sips/:id`) $\longrightarrow$ Tap *"What does this mean?"* $\longrightarrow$ Read Return Coach card.

#### Success Criteria (Must meet all)
* User locates and taps *"What does this mean?"* or *"Is this normal?"* without prompting within 45 seconds.
* User reads the 3-block narrative and explains in their own words:
  1. The $-2.1\%$ reflects early market movement on recent instalments.
  2. Early returns are based on a small invested amount and move closely with market noise.
  3. This does **not** indicate that the fund has permanently failed or that they must act immediately.
* User notices the cited source (e.g., AMFI or historical data badge).

#### Failure Criteria
* User attempts to leave the app to search Google or YouTube.
* User assumes INDmoney made a math calculation error.
* User interprets the text as an urgent prompt to exit, sell, or switch their fund.
* User does not find the *"What does this mean?"* trigger within 90 seconds.

#### Post-Task Questions
* *"In your own words, what did the app say about your negative return?"*
* *"Single Ease Question (SEQ): Overall, how easy or difficult was it to understand what happened to your investment? (1 = Very Difficult, 7 = Very Easy)"*
* **Compliance Check:** *"Did anything on this screen feel like INDmoney was advising you to buy more, sell, or switch funds? (Yes / No — Why?)"*

---

### Task 2: Explain What XIRR Means

#### Scenario & Moderator Prompt
> *"While reviewing your investment, you notice a percentage labeled 'XIRR: -4.8%'. You aren't sure how this is calculated or how it differs from your total profit/loss percentage. Without leaving the app, see if you can find an explanation of what XIRR means."*

#### Behavioral Task Flow
Return Coach / SIP Detail Screen $\longrightarrow$ Tap term chip `XIRR` $\longrightarrow$ Read Term Sheet modal.

#### Success Criteria (Must meet all)
* User identifies the interactive `XIRR` chip or link and taps it.
* Bottom sheet modal (`TermSheet`) slides up with the verified definition.
* User articulates the two core takeaways:
  1. XIRR is an annualized rate that accounts for money deposited at different dates.
  2. Over short periods (under 1 year), XIRR can show exaggerated percentages due to annualization math.
* User closes the sheet cleanly by tapping the close button, clicking outside, or swiping down.

#### Failure Criteria
* User clicks unlinked static text repeatedly looking for help.
* User closes the sheet without reading or expressing comprehension.
* User believes XIRR is an extra penalty fee or commission charged by the broker.

#### Post-Task Questions
* *"If a friend asked you what XIRR is, based on what you just read, what would you tell them?"*
* *"SEQ (1–7): How easy or difficult was it to find and understand the term definition?"*

---

### Task 3: Find Out Why an Instalment Failed

#### Scenario & Moderator Prompt
> *"It's the 7th of the month, which is your scheduled SIP debit date. You open your app and see a notice that your monthly instalment was not completed. Use the app to find out why the payment failed."*

#### Behavioral Task Flow
SIP Overview $\longrightarrow$ Spot amber status row (`ACTIVE · 1 MISSED INSTALMENT`) $\longrightarrow$ Tap failed row $\longrightarrow$ Read Debit Explainer screen (`/debit`).

#### Success Criteria (Must meet all)
* User locates the failed transaction entry in the transaction history or hero alert.
* User navigates into the Debit Explainer view within 30 seconds.
* User correctly identifies the plain-language root cause (e.g., *"My bank UPI daily transaction limit was exceeded"* or *"Insufficient balance on debit date"*).
* User notices the auto-retry date or manual retry button.

#### Failure Criteria
* User assumes their entire SIP has been permanently cancelled by the bank.
* User believes INDmoney debited the money and lost it.
* User cannot locate the failed instalment details within 60 seconds.

#### Post-Task Questions
* *"Why did this payment fail according to the app?"*
* *"SEQ (1–7): How easy or difficult was it to find the reason for the failed payment?"*

---

### Task 4: Determine Whether the SIP is Still Active

#### Scenario & Moderator Prompt
> *"Now that you know why the payment failed, you are worried about what happened to your ongoing SIP. Look at this screen and tell me: is your regular monthly SIP still running for next month, or has it been completely stopped?"*

#### Behavioral Task Flow
Debit Explainer screen $\longrightarrow$ Review *"Is my SIP still active?"* section $\longrightarrow$ Verify `ACTIVE` / `MISSED_CONTINUES` badge.

#### Success Criteria (Must meet all)
* User states unequivocally: *"Yes, my SIP is still active; only this one month was missed."*
* User points to the specific status chip or explanatory sentence confirming that the mandate remains in place.
* User correctly identifies that INDmoney did **not** charge a penalty fee for the missed instalment.

#### Failure Criteria
* User states they need to create a brand-new SIP from scratch.
* User believes they will be penalized or that their bank mandate was revoked.
* User expresses confusion over whether future instalments will debit automatically.

#### Post-Task Questions
* *"What will happen next month on your regular debit date?"*
* *"SEQ (1–7): How clear was the app about whether your SIP is still active?"*

---

### Task 5: Pause a SIP Until a Selected Date

#### Scenario & Moderator Prompt
> *"Imagine you have an unexpected car repair expense this month, and you want to temporarily take a break from your ₹2,500 monthly investment for the next 2 months. You want it to resume automatically in 2 months. How would you do that in the app?"*

#### Behavioral Task Flow
SIP Detail $\longrightarrow$ Tap *"Manage SIP"* $\longrightarrow$ Compare 3-way matrix (*Pause vs Reduce vs Cancel*) $\longrightarrow$ Select *"Pause SIP"* $\longrightarrow$ Select End Date (e.g. 2 months) $\longrightarrow$ Review Consequences $\longrightarrow$ Tap *"Confirm Pause"*.

#### Success Criteria (Must meet all)
* User locates *"Manage SIP"* in the primary view.
* User reviews the 3 equal options and selects *"Pause SIP"*.
* User sets the pause duration to a specific date 2 months out using the date picker or preset chip.
* User reads the confirmation summary (skipped debits, active units remain invested, zero penalties).
* User confirms the pause and verifies the updated status chip: `"PAUSED UNTIL [DATE]"`.

#### Failure Criteria
* User accidentally cancels the SIP entirely instead of pausing.
* User abandons the flow due to fear of hidden fees.
* User cannot find where to manage or pause the SIP within 90 seconds.

#### Post-Task Questions
* *"What did the app tell you would happen to the money you already invested while the SIP is paused?"*
* *"SEQ (1–7): How easy or difficult was it to pause your SIP until a specific date?"*

---

### Task 6: Enable a Restart Reminder

#### Scenario & Moderator Prompt
> *"While pausing your SIP, you want to make sure you don't forget that it is scheduled to restart. You want the app to send you a reminder before your next debit happens. Show me how you would set that up."*

#### Behavioral Task Flow
Pause Configuration Form $\longrightarrow$ Locate *"Remind me before restarting"* checkbox $\longrightarrow$ Tap checkbox to toggle ON $\longrightarrow$ Select preferred notification channel (In-App / Push) $\longrightarrow$ Confirm.

#### Success Criteria (Must meet all)
* User locates the opt-in reminder checkbox on the Pause form.
* User notes that the checkbox was **unchecked by default** (calm, user-consented).
* User enables the reminder and confirms the schedule (e.g. 7 days before restart).
* User articulates that the reminder will give them options to resume, extend, or stay paused.

#### Failure Criteria
* User fails to see the reminder checkbox before tapping confirm.
* User assumes the reminder will spam them repeatedly with urgent countdowns.
* User is unable to locate notification preference controls.

#### Post-Task Questions
* *"How will the app notify you, and what will you be able to do when that notification arrives?"*
* *"SEQ (1–7): How easy or difficult was it to set up the restart reminder?"*

---

## 6. System Usability Scale (SUS) Questionnaire

At the conclusion of the session, each participant completes the standardized 10-item **System Usability Scale (SUS)**. Items alternate between positive and negative assertions and are scored on a 5-point Likert scale ($1 = \text{Strongly Disagree}$, $5 = \text{Strongly Agree}$).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              STANDARDIZED 10-ITEM SUS FORM                             │
├────┬───────────────────────────────────────────────────────────────┬───────────────────┤
│ ID │ STATEMENT                                                     │ SCALE (1 to 5)    │
├────┼───────────────────────────────────────────────────────────────┼───────────────────┤
│ Q1 │ I think that I would like to use this system frequently.      │ [1] [2] [3] [4] [5│
│ Q2 │ I found the system unnecessarily complex.                     │ [1] [2] [3] [4] [5│
│ Q3 │ I thought the system was easy to use.                         │ [1] [2] [3] [4] [5│
│ Q4 │ I think that I would need the support of a technical person.  │ [1] [2] [3] [4] [5│
│ Q5 │ I found the various functions in this system well integrated. │ [1] [2] [3] [4] [5│
│ Q6 │ I thought there was too much inconsistency in this system.    │ [1] [2] [3] [4] [5│
│ Q7 │ I would imagine most people would learn this very quickly.    │ [1] [2] [3] [4] [5│
│ Q8 │ I found the system very cumbersome to use.                    │ [1] [2] [3] [4] [5│
│ Q9 │ I felt very confident using the system.                       │ [1] [2] [3] [4] [5│
│ Q10│ I needed to learn a lot of things before I could get going.   │ [1] [2] [3] [4] [5│
└────┴───────────────────────────────────────────────────────────────┴───────────────────┘
```

### Standard SUS Scoring Methodology

Let $R_i$ be the user's score ($1 \text{ to } 5$) for question $i$:
* For odd-numbered items ($Q1, Q3, Q5, Q7, Q9$), the contribution is:
  $$C_{\text{odd}} = R_i - 1$$
* For even-numbered items ($Q2, Q4, Q6, Q8, Q10$), the contribution is:
  $$C_{\text{even}} = 5 - R_i$$
* The composite SUS score ($0 \text{ to } 100$) is:
  $$\text{SUS Score} = 2.5 \times \sum_{i=1}^{10} C_i$$

### Formative Study Target Benchmark
* **Minimum Acceptable Floor:** $\text{SUS} \ge 72.0$ (Industry Average = $68.0$).
* **Target Success Benchmark:** $\mathbf{SUS \ge 80.0}$ (Corresponds to Grade "A" usability / top $10\%$ quartile).

---

## 7. Qualitative Observation & Data Collection Template

Observers use the structured logging sheet below during live sessions. No synthetic data is entered prior to execution.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        SESSION OBSERVATION & BEHAVIORAL LOG SHEET                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Participant ID: [ P-01 ]      Tenure: [ 4 Mo ]      Date/Time: [ _______________ ]     │
│ Moderator: [ _________ ]      Observer: [ _________ ] Prototype: [ SIP Steady v2.0 ]   │
├──────┬──────────────┬────────────┬─────────────┬─────────────┬─────────────────────────┤
│ TASK │ COMPLETION   │ TIME (SEC) │ ASSISTANCE? │ SEQ (1–7)   │ VERBATIM OBSERVER NOTES │
├──────┼──────────────┼────────────┼─────────────┼─────────────┼─────────────────────────┤
│ T1   │ [ ] Pass     │            │ [ ] None    │ [ / 7 ]     │ Path:                   │
│      │ [ ] Fail     │            │ [ ] Prompt  │             │ Quotes:                 │
│      │ [ ] Partial  │            │ [ ] Stuck   │             │ Hesitations:            │
├──────┼──────────────┼────────────┼─────────────┼─────────────┼─────────────────────────┤
│ T2   │ [ ] Pass     │            │ [ ] None    │ [ / 7 ]     │ Path:                   │
│      │ [ ] Fail     │            │ [ ] Prompt  │             │ Quotes:                 │
│      │ [ ] Partial  │            │ [ ] Stuck   │             │ Hesitations:            │
├──────┼──────────────┼────────────┼─────────────┼─────────────┼─────────────────────────┤
│ T3   │ [ ] Pass     │            │ [ ] None    │ [ / 7 ]     │ Path:                   │
│      │ [ ] Fail     │            │ [ ] Prompt  │             │ Quotes:                 │
│      │ [ ] Partial  │            │ [ ] Stuck   │             │ Hesitations:            │
├──────┼──────────────┼────────────┼─────────────┼─────────────┼─────────────────────────┤
│ T4   │ [ ] Pass     │            │ [ ] None    │ [ / 7 ]     │ Path:                   │
│      │ [ ] Fail     │            │ [ ] Prompt  │             │ Quotes:                 │
│      │ [ ] Partial  │            │ [ ] Stuck   │             │ Hesitations:            │
├──────┼──────────────┼────────────┼─────────────┼─────────────┼─────────────────────────┤
│ T5   │ [ ] Pass     │            │ [ ] None    │ [ / 7 ]     │ Path:                   │
│      │ [ ] Fail     │            │ [ ] Prompt  │             │ Quotes:                 │
│      │ [ ] Partial  │            │ [ ] Stuck   │             │ Hesitations:            │
├──────┼──────────────┼────────────┼─────────────┼─────────────┼─────────────────────────┤
│ T6   │ [ ] Pass     │            │ [ ] None    │ [ / 7 ]     │ Path:                   │
│      │ [ ] Fail     │            │ [ ] Prompt  │             │ Quotes:                 │
│      │ [ ] Partial  │            │ [ ] Stuck   │             │ Hesitations:            │
├──────┴──────────────┴────────────┴─────────────┴─────────────┴─────────────────────────┤
│ COMPLIANCE AUDIT FLAG:                                                                 │
│ Did participant express feeling guided, pushed, or advised to buy/sell/hold?           │
│ [ ] NO (Compliant)    [ ] YES — Exact trigger screen & phrasing:                       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Analysis Framework & Issue Severity Rubric

Following session completion, usability findings are aggregated and categorized into a prioritised engineering and design backlog:

### 8.1 Severity Classification Scheme

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              USABILITY SEVERITY RUBRIC                                 │
├───────────────┬────────────────────────────────────────────────┬───────────────────────┤
│ SEVERITY      │ DEFINITION & USER IMPACT                       │ RESOLUTION SLA        │
├───────────────┼────────────────────────────────────────────────┼───────────────────────┤
│ **Critical**  │ • User unable to complete task (blocker).      │ Must fix before Phase │
│ **(P0)**      │ • Interprets content as investment advice.     │ 8 gate sign-off;      │
│               │ • Believes money was lost or SIP cancelled.    │ blocks public rollout.│
├───────────────┼────────────────────────────────────────────────┼───────────────────────┤
│ **Major**     │ • Causes severe hesitation or friction.        │ Address in next sprint│
│ **(P1)**      │ • Requires moderator prompt or back-tracking.  │ iteration (V2 design).│
│               │ • SEQ score $\le 3$ out of 7.                  │                       │
├───────────────┼────────────────────────────────────────────────┼───────────────────────┤
│ **Minor**     │ • Cosmetic confusion or slight delay.          │ Polish in backlog     │
│ **(P2)**      │ • Task completed successfully on first try.    │ prior to general GA.  │
│               │ • Wording or visual hierarchy suggestion.      │                       │
└───────────────┴────────────────────────────────────────────────┴───────────────────────┘
```

### 8.2 Thematic Affinity Clustering
Findings will be clustered into four analytical dimensions:
1. **Volatility Literacy & Tone:** Did the 3-block narrative successfully alleviate anxiety without sounding dismissive?
2. **Transaction Triage:** Was the 3-part diagnostic (*Why, Is SIP Active, What to do*) immediately understood?
3. **Control Transparency:** Did users feel in complete control when scheduling pauses and reminders?
4. **Regulatory Boundaries:** Did all participants confirm that the experience felt educational rather than advisory?

---

## 9. Synthesis & Deliverable Roadmap

The output of this usability study will be synthesized into the **Usability Findings & Design Iteration Report** (`docs/usability-findings-report.md`) containing:
1. Executive summary of task completion rates and average SUS score across all participants.
2. Ranked matrix of identified usability defects with assigned severity (P0, P1, P2).
3. Exact verbatim quotes illustrating friction points and mental models.
4. Concrete UI/copy recommendations mapping directly into Phase 8 engineering tickets.
5. Final compliance sign-off validating that the experience does not breach SEBI RIA guidelines.

