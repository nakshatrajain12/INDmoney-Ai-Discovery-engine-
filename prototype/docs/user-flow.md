# User Flow & Interaction Specification: SIP Steady

**Document Version:** 2.0.0  
**Status:** Approved for Implementation & Visual Blueprinting  
**Target Platform:** INDmoney Mobile & Responsive Web (Next.js 16.4.5 + React 19)  
**Whimsical Conversion Standard:** Memory Board Node Architecture (Cards, Processes, Decisions, Terminals)  
**Inputs & Dependencies:**
- [`docs/detailed-rice.md`](detailed-rice.md)
- [`docs/archive/mvp-original/architecture.md`](archive/mvp-original/architecture.md)
- [`docs/archive/mvp-original/implementation-plan.md`](archive/mvp-original/implementation-plan.md)
- [`prototype/prototype/clickable/app.js`](../clickable-prototype/clickable/app.js)

---

## 1. Executive Summary & Design Principles

This document defines the formal user flows for the three core modules of the **SIP Steady** retention engine:
1. **Journey 1: Return Coach** — In-situ volatility reassurance and metric contextualization.
2. **Journey 2: Debit Explainer** — Triage and recovery for failed auto-debits and mandate glitches.
3. **Journey 3: Pause and Restart** — Reversible cash-flow flexibility with opt-in, non-urgent reminders.

### Mandatory UX & Regulatory Guardrails

All three user journeys strictly enforce the following behavioral and compliance rules:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              MANDATORY DESIGN GUARDRAILS                               │
├──────────────────────────────┬──────────────────────────────┬──────────────────────────┤
│ 1. CALM & NON-URGENT         │ 2. STRICT NON-ADVICE         │ 3. DETERMINISTIC CORE    │
│ • No countdown timers        │ • Persistent visible notice: │ • Hardcoded rule tables  │
│ • No streak-loss warnings    │   "Explains figures. Not     │ • Scaled integer math    │
│ • No guilt or FOMO phrasing  │   investment advice."        │ • 0 runtime hallucination│
│ • Coral ONLY for tech errors │ • 100% refusal of buy/sell   │ • Cited AMFI/SEBI sources│
└──────────────────────────────┴──────────────────────────────┴──────────────────────────┘
```

---

## 2. Whimsical Board Conversion & Node Legend

To allow immediate conversion into a visual **Whimsical Memory Board**, all steps and flowchart elements follow a standardized visual and structural taxonomy:

### Node Shape & Color Mapping

| Visual Element | Whimsical Shape | Color Token | Hex Code | Purpose |
|:---|:---|:---|:---:|:---|
| **Screen / View** | Card / Rectangle | Dark Slate / Navy | `#0F172A` / `#1E293B` | A full screen, dashboard view, or modal sheet. |
| **User Action** | Rounded Rectangle / Pill | Royal Blue | `#1A6BFF` / `#2563EB` | A conscious user interaction (tap, scroll, submit). |
| **System Process** | Subroutine / Box | Indigo / Purple | `#4338CA` / `#6366F1` | An automated backend API call, calculation, or query. |
| **Decision Point** | Diamond (Rhombus) | Amber | `#D97706` / `#F59E0B` | A conditional branch based on user choice or data state. |
| **Refusal / Fallback**| Hexagon / Callout | Coral / Rose | `#DC2626` / `#EB5B3C` | Non-advice refusals, error states, or "Not Sure" fallbacks.|
| **Terminal / Exit** | Circle / Oval | Emerald Green | `#059669` / `#00B386` | Successful task completion or return to dashboard. |

```mermaid
flowchart LR
    A["[Screen / View]<br/>Navy #0F172A"] --> B(["User Action<br/>Blue #1A6BFF"])
    B --> C[["System Process<br/>Indigo #4338CA"]]
    C --> D{"Decision?<br/>Amber #F59E0B"}
    D -- Pass --> E["Terminal / Exit<br/>Emerald #00B386"]
    D -- Refusal --> F["Refusal / Fallback<br/>Coral #EB5B3C"]
```

---

## 3. High-Level Navigation Architecture

The master navigation connects the global SIP overview with the three dedicated feature modules:

```mermaid
flowchart TD
    Dashboard["SIP Dashboard (/sips)"] --> SelectSIP(["User selects target SIP"])
    SelectSIP --> SIPDetail["SIP Detail & Portfolio Hero (/sips/:id)"]

    SIPDetail --> PathCoach{"Trigger Context?"}
    
    PathCoach -- "Confused by returns / 'What does this mean?'" --> J1["Journey 1: Return Coach (/sips/:id/coach)"]
    PathCoach -- "Instalment failed / 'Payment Unsuccessful'" --> J2["Journey 2: Debit Explainer (/sips/:id/debit)"]
    PathCoach -- "Cash-flow squeeze / 'Manage SIP'" --> J3["Journey 3: Pause & Restart (/sips/:id/pause)"]

    J1 --> ExitDashboard["Return to SIP Detail"]
    J2 --> ExitDashboard
    J3 --> ExitDashboard
```

---

## 4. Journey 1: Return Coach (Contextual Volatility Reassurance)

### 4.1 Required Primary Flow Progression
$$\text{SIP Dashboard} \longrightarrow \text{Select SIP} \longrightarrow \text{Understand Returns} \longrightarrow \text{Fetch Verified Financial Data} \longrightarrow \text{Calculate Metrics} \longrightarrow \text{Generate Explanation} \longrightarrow \text{Display Sources and Confidence} \longrightarrow \text{User Understands OR Asks Follow-up}$$

### 4.2 Mermaid Flowchart: Return Coach & Advice Refusal Branch

```mermaid
flowchart TD
    %% Journey 1: Return Coach
    subgraph S1_Entry["1. Entry & Data Ingestion"]
        D1["SIP Dashboard (/sips)"] --> D2(["User selects SIP with flat/negative return"])
        D2 --> D3["SIP Detail Hero Screen"]
        D3 --> D4(["User taps 'Understand Returns' / 'What does this mean?'"])
        D4 --> D5[["GET /api/v1/sips/:id/financials<br/>Fetch verified transaction ledger"]]
    end

    subgraph S1_Processing["2. Deterministic Calculation & Triage"]
        D5 --> D6[["Return Engine: Calculate Absolute % & Bisection XIRR<br/>(Integer paise arithmetic)"]]
        D6 --> D7{"Data Complete & Valid?"}
        
        D7 -- "Incomplete / Stale Valuation" --> D8["Fallback Card: 'I am not sure about this yet'<br/>Show official AMC link and Support action"]
        D7 -- "Valid Ledger" --> D9[["Classify Return Band and Tenure Stage<br/>(FLAT | NEGATIVE | LOW_POS | HIGH_POS)"]]
    end

    subgraph S1_Presentation["3. Narrative Explanation and Citations"]
        D9 --> D10[["Retrieve Verified Template and AMFI/SEBI Citations"]]
        D10 --> D11["Render Return Coach Screen:<br/>• Block 1: Your Figures (Tabular-nums)<br/>• Block 2: What this means at Month N<br/>• Block 3: What it does NOT mean<br/>• Citations and Confidence (HIGH / MEDIUM)<br/>• Visible Disclaimer: 'Not investment advice'"]
    end

    subgraph S1_Interaction["4. User Decision and Follow-Up"]
        D11 --> D12{"User Next Action?"}
        
        D12 -- "Understands and Reassured" --> D13(["User taps 'Was this clear? Yes'"])
        D13 --> D14["Record Feedback: isClear=true<br/>Return to SIP Detail"]

        D12 -- "Taps Financial Term" --> D15(["User taps term chip: 'XIRR' or 'Absolute'"])
        D15 --> D16["Open TermSheet Bottom Sheet:<br/>Verified definition and short-period warning"]
        D16 --> D17(["Close TermSheet"]) --> D11

        D12 -- "Enters Follow-Up Question" --> D18(["User inputs question in follow-up box"])
    end

    subgraph S1_Refusal["5. Advice Refusal Interceptor (Deterministic)"]
        D18 --> D19[["Advice Pre-Filter and Intent Classifier"]]
        D19 --> D20{"Matches Banned Advice Patterns?<br/>('Should I sell/stop?', 'Which fund?', 'Will it recover?')"}
        
        D20 -- "Banned Advice Request" --> D21["Advice Refusal Card:<br/>'We cannot recommend buying, selling, or continuing funds.'<br/>Show SEBI Investor Education and Registered Adviser link"]
        D21 --> D22(["User acknowledges boundary"]) --> D14

        D20 -- "Valid Factual Query" --> D23[["Factual RAG Answer (Zero Digits Generated)<br/>Restricted to scheme factsheet & historical ranges"]]
        D23 --> D24["Display Factual Answer + AMC Factsheet Source"]
        D24 --> D14
    end

    D8 --> D14
```

### 4.3 Detailed Specification: Return Coach

| Attribute | Specification Details |
|:---|:---|
| **Entry Point** | 1. Persistent text link: *"What does this mean?"* adjacent to the return figure on the SIP Detail card.<br>2. Secondary button: *"Is this normal for my stage?"* beneath the Hero valuation.<br>3. Term chip tap on *"XIRR"* or *"Absolute Return"*. |
| **User Action** | The investor taps *"What does this mean?"* on a portfolio showing early flat or negative returns (e.g. Month 5, $-2.1\%$). |
| **System Response** | 1. Displays loading skeleton with zero alarm colors.<br>2. Invokes `GET /api/v1/sips/:id/financials` fetching integer paise ledger.<br>3. Computes exact $A\%$ (Absolute Return) and iterative bisection XIRR.<br>4. Evaluates tenure bracket ($1–3\text{m}$, $3–6\text{m}$, $6–12\text{m}$) and return band (`NEGATIVE`).<br>5. Assembles approved 3-block narrative: *Your Figures*, *What this means*, *What it does NOT mean*.<br>6. Appends verified AMFI citation and confidence badge (`HIGH`).<br>7. Renders persistent compliance disclaimer: *"Explains your SIP figures. Not investment advice."* |
| **Decision Points** | 1. **Data Integrity Check:** Does the SIP have $\ge 2$ settled instalments and a matching valuation timestamp?<br>2. **User Inquiry Type:** Does the user accept the explanation, inspect a term, or submit a follow-up query?<br>3. **Advice Pre-Filter Gate:** Does the user's follow-up question ask for recommendation or future prediction? |
| **Alternative Paths** | 1. **Term Sheet Flow (F3):** User taps "XIRR" chip $\to$ opens accessible bottom sheet containing AMFI definition and short-tenure distortion caveat.<br>2. **Positive Return Stage (F6):** Available on-demand for positive portfolios; displays milestone reinforcement without predictive promises.<br>3. **Factual Query Flow:** User asks *"How is XIRR calculated?"* $\to$ returns verified mathematical formula. |
| **Failure States** | 1. **Insufficient Data (F1):** Tenure $< 1$ month $\to$ displays neutral card: *"Not enough instalments yet to establish performance patterns"*, links to AMFI Guide.<br>2. **Valuation Date Mismatch (RC-E4b):** Stale NAV timestamp $\to$ suppresses calculation, shows *"Portfolio data refreshing from AMC"*, disables Coach.<br>3. **XIRR Divergence (F5):** Bisection math diverges from broker display $> 50\text{ bps}$ $\to$ displays account figure with label *"as shown in account"*, lowers confidence to `MEDIUM`. |
| **Advice-Seeking Refusal Branch** | **Trigger:** User enters *"Should I stop my SIP?"*, *"Will this fund recover?"*, or *"Which fund is better?"*<br>**System Action:** Intercepted by deterministic pre-filter in `banned-phrases.ts` before reaching any model.<br>**Refusal UI:** Renders non-judgmental card: *"INDmoney explains portfolio figures but cannot provide financial advice, fund ratings, or buy/sell recommendations."*<br>**Pointer:** Provides link to SEBI Investor Education portal and directory of registered Investment Advisers (RIAs). |
| **Exit Point** | User taps *"Back to SIP Overview"*, closing the Coach with zero follow-up nudges or unrequested push notifications. |

---

## 5. Journey 2: Debit Explainer (Payment & Mandate Repair)

### 5.1 Required Primary Flow Progression
$$\text{Failed Debit Notification / Row} \longrightarrow \text{Open Debit Explainer} \longrightarrow \text{Evaluate NPCI Reason Code} \longrightarrow \text{Display 3 Structured Answers} \longrightarrow \text{Execute 1-Tap Retry OR Mandate Action} \longrightarrow \text{Confirm Recovery & Update SIP Status}$$

### 5.2 Mermaid Flowchart: Debit Explainer

```mermaid
flowchart TD
    %% Journey 2: Debit Explainer
    subgraph S2_Entry["1. Entry Point"]
        E1["SIP Detail Screen"] --> E2["Amber Status Chip: 'ACTIVE · 1 MISSED INSTALMENT'"]
        E2 --> E3(["User taps missed instalment row"])
        E0["System Push Notification:<br/>'Instalment couldn't be debited'"] --> E3
    end

    subgraph S2_Triage["2. Error Diagnostic Engine"]
        E3 --> E4[["GET /api/v1/debit-events/:id/explain<br/>Fetch raw bank & NPCI error payload"]]
        E4 --> E5[["Match against debit-rules.v1.json<br/>(7 deterministic failure categories)"]]
        E5 --> E6{"Is Reason Code Mapped?"}
        
        E6 -- "Unmapped / Unknown Code" --> E7["Generic Fallback Card (F-D1):<br/>'We could not complete this debit.'<br/>Status: ACTIVE · Contact Bank Support"]
        E6 -- "Mapped Category" --> E8[["Extract Structured Triad:<br/>1. Why it failed<br/>2. Is my SIP still active?<br/>3. What to do next"]]
    end

    subgraph S2_Display["3. Structured Resolution View"]
        E8 --> E9["Render Debit Explainer Screen (/debit):<br/>• Reason Card: Plain-language diagnostic<br/>• Status Chip: ACTIVE (Mandate Intact)<br/>• Next Action: Clear primary recovery button<br/>• Auto-retry info (if bank supports)"]
        E7 --> E9
    end

    subgraph S2_Action["4. Recovery Execution and Idempotency"]
        E9 --> E10{"Primary Action Type?"}

        E10 -- "Manual Retry Allowed (e.g. Balance / UPI Limit)" --> E11(["User taps 'Add balance and retry now'"])
        E12["Display Confirmation Sheet:<br/>Amount, Linked Bank, Zero Fee Guarantee"]
        E11 --> E12
        E12 --> E13(["User confirms payment"])
        E13 --> E14[["POST /api/v1/debit-events/:id/retry<br/>(Idempotency Key attached)"]]
        
        E14 --> E15{"Payment Gateway Result?"}
        E15 -- "Success" --> E16["Success Screen: Instalment Settled<br/>Status updated to ACTIVE"]
        E15 -- "Failed Again" --> E17["Failure Re-triage Card:<br/>Display new reason code and Next retry date"]

        E10 -- "Mandate Glitch / Inactive (F-D3)" --> E18(["User taps 'Re-link UPI Autopay'"])
        E18 --> E19[["Redirect to NPCI Mandate Authorization Rail"]]
        E19 --> E20["Mandate Active Confirmation"]

        E10 -- "Secondary Help / Pause Option" --> E21(["User taps 'Having cash-flow issues? Pause SIP'"])
        E21 --> E22["Redirect to Journey 3: Pause & Restart"]
    end

    E16 --> E23["((Exit: Return to SIP Detail))"]
    E20 --> E23
    E17 --> E23
```

### 5.3 Detailed Specification: Debit Explainer

| Attribute | Specification Details |
|:---|:---|
| **Entry Point** | 1. Tapping an amber-flagged row in the SIP transaction history (*"Debit Failed — Tap for details"*).<br>2. Tapping the transactional push/in-app alert (*"Your ₹2,500 SIP instalment could not be debited"*). |
| **User Action** | The investor taps the failed transaction to understand why the deduction failed and whether their SIP was cancelled. |
| **System Response** | 1. Queries `debit-rules.v1.json` using the sponsor bank/NPCI error code (e.g., `U30`, `INSUFFICIENT_FUNDS`).<br>2. Maps raw code to one of 7 standardized categories (`BALANCE`, `UPI_LIMIT`, `MANDATE_EXPIRED`, `BANK_DOWNTIME`, `AUTH_FAILED`, `ACCOUNT_BLOCKED`, `TECHNICAL`).<br>3. Displays the three mandatory questions: **Why it failed**, **Is my SIP still active?**, and **What to do next**.<br>4. Reassures user with verified status: mandate remains active; no penalty charge from INDmoney. |
| **Decision Points** | 1. **Manual Retry Eligibility:** Does the bank rail permit immediate on-demand retry, or is it locked to batch auto-retry?<br>2. **Action Routing:** Does the root cause require balance addition, UPI limit reset, or mandate re-authorization?<br>3. **User Continuation:** Does the user initiate immediate recovery, re-authorise mandate, or seek pause options? |
| **Alternative Paths** | 1. **Mandate Re-Linking (F-D3):** If mandate expired or cancelled $\to$ replaces retry button with *"Re-authorise Mandate"*, initiating fresh NPCI UPI handle setup.<br>2. **Daily Limit Exceeded (F-D4):** Reason clarifies UPI app limits $\to$ prompts user to retry using NetBanking or increase limit.<br>3. **Cash-Flow Pivot (F-P10):** Secondary, quiet link beneath retry button: *"Need to pause this month instead?"* $\to$ routes to Journey 3. |
| **Failure States** | 1. **Unmapped Error Code (F-D1):** Bank sends obscure custom code $\to$ system displays calm fallback: *"We couldn't complete this debit. Your SIP remains active"*, provides support contact.<br>2. **Retry Fails Again (RC-E07):** Second attempt rejected $\to$ shows updated diagnostic, indicates scheduled automatic retry date, prevents infinite retry loops.<br>3. **Double-Debit Prevention:** Enforces client-generated `idempotencyKey` on retry button; disables button immediately on first tap. |
| **Exit Point** | Returns to SIP Detail displaying updated status badge (`ACTIVE` on success, or `ACTIVE · NEXT RETRY [DATE]`). |

---

## 6. Journey 3: Pause and Restart (Cash-Flow Flexibility)

### 6.1 Required Primary Flow Progression
$$\text{SIP Detail} \longrightarrow \text{Manage SIP} \longrightarrow \text{3-Way Equal Matrix} \longrightarrow \text{Select Pause} \longrightarrow \text{Set Duration & Opt-In Reminder} \longrightarrow \text{Review Verified Consequences} \longrightarrow \text{Confirm Pause} \longrightarrow \text{State: PAUSED / RESTART_PENDING} \longrightarrow \text{Opt-In Reminder: Resume / Extend / Dismiss}$$

### 6.2 Mermaid Flowchart: Pause and Restart

```mermaid
flowchart TD
    %% Journey 3: Pause and Restart
    subgraph S3_Entry["1. Entry & Comparison Matrix"]
        P1["SIP Detail Screen"] --> P2(["User taps 'Manage SIP'"])
        P2 --> P3["Options Comparison Matrix (/pause):<br/>Three Equal Cards with Verified Facts<br/>• Pause SIP (Temporary)<br/>• Reduce Amount (Sustain habit)<br/>• Cancel SIP (Permanent)"]
        
        P3 --> P4{"User Option Selection"}
        P4 -- "Reduce Amount" --> P5["Reduce Form: Lower monthly commitment"]
        P4 -- "Cancel SIP" --> P6["Cancel Flow: One-tap confirm, zero retention guilt"]
        P4 -- "Pause SIP" --> P7(["User selects 'Pause SIP'"])
    end

    subgraph S3_Configuration["2. Schedule & Opt-In Configuration"]
        P7 --> P8["Pause Configuration Form (/pause/configure):<br/>1. Start Date (Default: Next scheduled debit)<br/>2. Duration: ( ) 1–3 Months  ( ) Specific Date  ( ) Until I resume<br/>3. Opt-in Reminder Checkbox [ ] (OFF by default)"]
        
        P8 --> P9(["User selects End Date (e.g. 2 months)"])
        P8 --> P10(["User checks: 'Remind me before restarting'"])
        
        P9 --> P11["Review Plain Consequences:<br/>• Next 2 debits will be skipped<br/>• Accumulated units remain invested<br/>• Zero penalty or bank fee<br/>• Mandate resumes automatically on selected date"]
        P10 --> P11
    end

    subgraph S3_Confirmation["3. State Transition & Activation"]
        P11 --> P12(["User taps 'Confirm Pause'"])
        P12 --> P13[["POST /api/v1/sips/:id/pause<br/>(Persist startDate, endDate, optInReminder)"]]
        P13 --> P14["Pause Confirmed View (/pause/success):<br/>• Status: 'PAUSED UNTIL [DATE]'<br/>• [Undo Pause] button available for 24h<br/>• Plain explanation of next steps"]
        P14 --> P15["((Exit to SIP Detail))"]
    end

    subgraph S3_Lifecycle["4. Paused State & Dynamic Lifecycle"]
        P15 --> P16["SIP Detail View during Pause:<br/>• Navy Hero card shows paused status chip<br/>• Zero countdown timers, zero guilt banners<br/>• Primary action: [Resume Now] [Change Dates]"]
        
        P16 --> P17{"System Date vs Restart Date"}
        P17 -- "Restart Date > 14 days away" --> P18["Derived Status: PAUSED (Blue Chip)"]
        P17 -- "Restart Date <= 14 days away" --> P19["Derived Status: RESTART_PENDING (Amber/Blue Chip)"]
    end

    subgraph S3_Reminder["5. Opt-In Reminder Execution (One-Time Only)"]
        P19 --> P20{"User Opted into Reminder?"}
        P20 -- "No" --> P21["Zero messages sent. Resumes quietly on end date."]
        P20 -- "Yes" --> P22[["Trigger Scheduled In-App Notification<br/>(Zero loss framing / neutral copy)"]]
        
        P22 --> P23["In-App Message: 'Your SIP is scheduled to resume on [Date]'<br/>Three Equal Actions:<br/>[ Resume as Planned ]  [ Extend Pause ]  [ Leave Paused ]"]
        
        P23 --> P24{"User Response to Reminder"}
        P24 -- "Resume" --> P25[["PATCH /api/v1/pauses/:id/resume<br/>Reactivate mandate immediately"]]
        P24 -- "Extend" --> P26["Date Picker Sheet: Select new resume date"]
        P24 -- "Dismiss / Ignore" --> P27["Notification dismissed.<br/>Zero follow-up or nag messages sent."]
    end

    P25 --> P15
    P26 --> P13
```

### 6.3 Detailed Specification: Pause and Restart

| Attribute | Specification Details |
|:---|:---|
| **Entry Point** | 1. Tapping *"Manage SIP"* in the top navigation of the SIP Detail screen.<br>2. Secondary link on the Debit Explainer screen: *"Looking for pause options instead?"* |
| **User Action** | The investor selects *"Pause SIP"* from a 3-way side-by-side comparison matrix (*Pause vs Reduce vs Cancel*). |
| **System Response** | 1. Presents the Pause Configuration form with neutral, factual language.<br>2. Sets default start date to the next upcoming debit date.<br>3. Offers duration presets (1 month, 2 months, 3 months, custom calendar date, or *"Until I resume"*).<br>4. Provides an **opt-in checkbox** for restart reminders (strictly **unchecked by default**).<br>5. Summarizes verified consequences: skipped debits, mandate status, and zero platform fees. |
| **Decision Points** | 1. **Comparison Matrix Choice:** Does the user decide to pause, reduce amount (keeping habit alive), or cancel completely?<br>2. **Duration Structure:** Does the user select a fixed calendar end date or an open-ended pause?<br>3. **Reminder Consent:** Does the user voluntarily check the box to receive an advance reminder? |
| **Alternative Paths** | 1. **Immediate Undo (RC-P04):** Within 24 hours of confirmation, user can tap *"Undo Pause"* $\to$ reverts SIP to `ACTIVE` instantly.<br>2. **Reduce Amount Flow (F-P3):** User selects *"Reduce amount instead"* $\to$ opens slider/input to adjust monthly debit (e.g. ₹2,500 $\to$ ₹1,000) without breaking tenure.<br>3. **Clean Cancellation (F-P4):** User selects *"Cancel"* $\to$ requires single factual confirmation with zero guilt questionnaires, zero retention discounts, and zero friction. |
| **Failure States** | 1. **Past Date Selection:** Date picker rejects any date prior to `today + 2 business days` (mandate processing window).<br>2. **Platform Mandate Incompatibility (F-P2):** If user's sponsor bank does not support automated pause $\to$ UI explicitly explains that upcoming debits will be skipped at AMC level while mandate stays active.<br>3. **Illegal Action Guard (F-P5):** Rejects attempt to pause an already cancelled SIP or resume an active SIP with clean error messaging. |
| **Lifecycle & Reminder Mechanics** | 1. **Derived Status `RESTART_PENDING`:** When an active pause enters $\le 14$ calendar days before its scheduled resume date, status chip dynamically switches from `PAUSED` (Blue) to `RESTART_PENDING` (Amber/Blue).<br>2. **One-Time Reminder Rule:** If opted in, sends **exactly one** factual message: *"Your SIP is scheduled to resume on [Date]"* offering 3 equal actions: `Resume`, `Extend`, `Leave Paused`.<br>3. **Zero-Nag Rule:** If the reminder is ignored or dismissed, **no second reminder, push notification, or escalation email is ever triggered**. |
| **Exit Point** | Returns to SIP Detail displaying active pause dates and clear, accessible *"Resume Now"* / *"Change Dates"* buttons. |

---

## 7. Implemented Features vs. Hypothetical / Deferred Interactions

To maintain strict engineering fidelity and avoid mixing production reality with speculative roadmap concepts, the table below provides an explicit boundary audit:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              SCOPE & IMPLEMENTATION AUDIT                              │
├────────────────────────────────────────┬───────────────────────────────────────────────┤
│ IMPLEMENTED IN CODE & PROTOTYPE        │ HYPOTHETICAL / DEFERRED TO FUTURE PHASES      │
├────────────────────────────────────────┼───────────────────────────────────────────────┤
│ • Deterministic Integer/BigInt Math    │ • Free-form, unconstrained generative chat    │
│ • Bisection XIRR Solver (Decimal.js)   │ • Real-time bank balance scraping via AA      │
│ • 4 Return Bands (FLAT, NEG, POS, HIGH)│ • Automated predictive cash-flow rescheduling │
│ • 3-Block Approved Narrative Templates │ • Dynamic AI generation of financial figures  │
│ • AMFI/SEBI Verified Citation Engine   │ • Bank fee prediction without verified API    │
│ • Deterministic Advice Refusal Filter  │ • Conversational debit troubleshooting chatbot│
│ • 7-Category Debit Rules Table         │ • Multi-turn conversational memory store      │
│ • Idempotent 1-Tap Debit Retry Flow    │ • Push notification marketing campaigns       │
│ • 3-Way Matrix (Pause/Reduce/Cancel)   │ • Streak gamification or social badges        │
│ • <=14d RESTART_PENDING State Machine  │ • Dark-pattern retention cancel questionnaires│
└────────────────────────────────────────┴───────────────────────────────────────────────┘
```

---

## 8. Whimsical Board Setup & Step-by-Step Translation Guide

For product managers, UX designers, or engineers converting this specification into a visual **Whimsical Diagram**, follow these layout instructions:

### Layout Coordinates & Board Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│ WHIMSICAL CANVAS WORKSPACE                                                                     │
│                                                                                                │
│  [BOARD 1: RETURN COACH]            [BOARD 2: DEBIT EXPLAINER]        [BOARD 3: PAUSE & RESTART]│
│  (X: 0 to 800, Y: 0 to 1200)        (X: 900 to 1700, Y: 0 to 1200)    (X: 1800 to 2600, Y: 0)  │
│                                                                                                │
│  Row 1: Entry & Triggers            Row 1: Failure Triggers           Row 1: Manage Trigger    │
│  Row 2: Ingestion & Math Engine     Row 2: 7-Rule Evaluation          Row 2: 3-Way Matrix      │
│  Row 3: Explanation Cards           Row 3: Triad UI Display           Row 3: Schedule & Opt-In │
│  Row 4: Advice Refusal Branch       Row 4: Idempotent Retry Rail      Row 4: State Machine     │
│  Row 5: Terminals & Feedback        Row 5: Recovery Confirmation      Row 5: 1-Time Reminder   │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Conversion Step-by-Step

1. **Step 1: Set Canvas Theme to Dark / High Contrast:**
   - Background canvas: `#0B0E14` or dark gray.
   - Screen cards: `#151A23` with 1px border `#262F40`.
2. **Step 2: Add Entry Points:**
   - Create Navy Cards for `SIP Dashboard` and `SIP Detail`.
   - Connect using standard directional arrows with labeled trigger text.
3. **Step 3: Plot Decision Diamonds for System Gates:**
   - Use Amber Diamonds for `Data Complete?`, `Code Mapped?`, and `Banned Advice?`.
   - Route `Yes` along the primary straight path; route `No` / `Refusal` to the right-hand branch.
4. **Step 4: Style the Refusal and Fallback Nodes:**
   - Use Coral Cards (`#EB5B3C`) for the Advice Refusal card and "Not Sure" fallbacks.
   - Explicitly label them with the compliance disclaimer text.
5. **Step 5: Connect Terminals:**
   - Terminate every journey in an Emerald Oval (`#00B386`) representing safe return to the `SIP Detail` dashboard.
