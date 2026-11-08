# INDmoney SIP Steady: Interactive Prototype Walkthrough Guide

**Document Status:** Evaluator & Review Board Guide  
**Project:** INDmoney SIP Confidence & Recovery Experience (`SIP Steady`)  
**Target Build:** Next.js App Router (Parity with Stitch Specification)  
**Port:** `http://localhost:3000` (Local) / Production Deployment URL  

---

## 1. Quickstart & Launching the Prototype

### Prerequisites
- Node.js `20.x` or `22.x`+
- npm `10.x`+

### 1-Command Startup
```bash
cd prototype
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser (recommended: Chrome or Safari with mobile viewport / DevTools set to iPhone 15 Pro / 430x932).

---

## 2. Navigational Overview & Global Controls

```
┌────────────────────────────────────────────────────────────────────────┐
│                              MOBILE APP SHELL                          │
├────────────────────────────────────────────────────────────────────────┤
│ [Header] Brand "INDmoney" · Title & Eyebrow · Privacy Mask · Theme · Demo│
├────────────────────────────────────────────────────────────────────────┤
│ [Main Content Area]                                                    │
│  • Screen 1: Dashboard (`/`)                                          │
│  • Screen 2: SIP Detail & Ledger (`/sip/[id]`)                         │
│  • Screen 3: Return Coach (`/sip/[id]/coach`)                          │
│  • Screen 4: Debit Explainer (`/sip/[id]/debit/[eventId]`)             │
│  • Screen 5: Pause & Options Grid (`/sip/[id]/pause`)                  │
│  • Screen 6: Ledger View (`/ledger`)                                   │
│  • Screen 7: In-App Inbox (`/inbox`)                                   │
├────────────────────────────────────────────────────────────────────────┤
│ [Bottom Nav]  SIPs (Home)  │  Coach  │  Ledger  │  Demo Drawer (Switch)│
└────────────────────────────────────────────────────────────────────────┘
```

### Global Header Controls
1. **Eye Privacy Toggle (`👁`):** Toggles privacy masking (`••••••`) across all currency figures (`invested`, `current valuation`, `returns`).
2. **Theme Switcher (`☀️ / 🌙`):** Toggles between Dark Mode (default `#0B0E14`) and Light Mode (`#F4F6F9`) with zero hydration mismatch.
3. **Demo Drawer Toggle (`⚡`):** Opens the side-drawer allowing instantaneous switching between all 30 research personas and time-travel simulation (+1d, +7d, +30d).
4. **Notification Bell:** Directs to the In-App Inbox (`/inbox`) displaying calm reminders and transaction receipts.

---

## 3. Interactive Walkthrough Journeys

### Journey 1: Volatility Reassurance (Return Coach)
**Target Persona:** Select `early-flat` (Month 5 early small negative, $-2.1\%$) or `negative-large` (Month 5 dip, $-8.5\%$) from the Demo Drawer.

1. **Dashboard Entry:**
   - Observe the **NetWorthHero** card in signature deep navy. Note that negative returns are rendered in clean neutral `#F8FAFC`, strictly avoiding panic-inducing red or coral.
   - Tap the contextual trigger banner: *"What does my Northstar return mean?"*.
2. **Return Coach Screen (`/sip/[id]/coach`):**
   - **Block 1 (Your figures):** View exact calculation figures (Invested, Current Value, Return, Annualised XIRR).
   - **Block 2 (What this means):** Learn how rupee cost averaging accumulated more units at discounted NAV.
   - **Block 3 (What it does not mean):** Confirms that a month 5 dip does not mean the fund is failing or guarantee future compounding.
   - **Interactive Term Sheets:** Tap any underlined term (`XIRR`, `NAV`, `Volatility`) to open the educational bottom sheet modal.
   - **Source Grounding:** Tap the verified source badge to view the AMFI / SEBI citation.
3. **Adversarial Advice Intercept:**
   - Type *"Should I stop my SIP today?"* or tap the suggested prompt chip.
   - Observe the **100% deterministic refusal card**: explicitly disclaims investment advice and provides links to the SEBI-registered Investment Adviser directory.

---

### Journey 2: Failed Auto-Debit Recovery (Debit Explainer)
**Target Persona:** Select `debit-insufficient-balance` or `debit-upi-limit` from the Demo Drawer.

1. **Dashboard Alert:**
   - Observe the top failure alert card: *"Auto-debit could not be processed"*.
   - Tap *"View details & resolve"*.
2. **Debit Explainer Detail (`/sip/[id]/debit/[eventId]`):**
   - **Status Continuity:** Observe the prominent amber status chip: `Active · 1 failed instalment`.
   - **Continuity Guarantee:** Read the explicit confirmation: *"SIP remains active. No penalty charges apply."*
   - **Plain-Language Diagnosis:** View the 3-part diagnostic explaining why the bank debit failed in plain English with zero cryptic gateway error codes.
3. **1-Tap Recovery Flow:**
   - Tap the primary action: *"Pay ₹5,000 manually now"*.
   - In the slide-up confirmation sheet (`08-pay-confirm-sheet`), review the pre-filled UPI payment details.
   - Tap *"Authorize ₹5,000 via UPI"*.
   - Observe the instant success confirmation (`09-pay-success`): status immediately updates to `Active` and the instalment is marked as settled in the ledger.

---

### Journey 3: Cash-Flow Flexibility (Pause & Options Machine)
**Target Persona:** Select `cashflow-pause` from the Demo Drawer.

1. **SIP Detail View (`/sip/[id]`):**
   - Tap *"Manage SIP"* $\rightarrow$ *"Explore Options (Pause / Reduce)"*.
2. **Options Comparison Screen (`/sip/[id]/pause`):**
   - **Equal-Weight Matrix:** Compare *Pause SIP*, *Reduce Amount*, and *Cancel SIP* presented in equal visual weight with factual trade-offs.
   - **Duration Selector:** Select `2 Months` pause duration.
   - **Calm Reminders:** Notice the pre-checked calm reminder: *"Remind me 3 days before resumption via In-App notice"*.
   - **Acknowledgment:** Check the mandatory explicit confirmation checkbox.
   - Tap *"Confirm 2-Month Pause"*.
3. **60-Second Undo Window:**
   - Observe the prominent green confirmation banner with a real-time countdown timer: *"SIP Paused until Jan 15, 2027 · Undo (59s remaining)"*.
   - Tap *"Undo Pause"* within 60 seconds to instantly revert the SIP to active status without penalty.

---

## 4. Demo Drawer: The 30 Persona Catalog

The Demo Drawer (`⚡` button in the header or bottom navigation) allows instant persona switching:

| Group | Personas Included | Primary Behavior Demonstrated |
|---|---|---|
| **Core Returns** | `early-flat`, `positive`, `negative-large`, `flat-zero`, `flat-micro`, `long-tenure` | Full spectrum of return bands; 3-block narratives; rupee cost averaging sparklines. |
| **Short Tenure** | `new-month-1`, `short-weekly`, `two-instalments` | Stage `M1` graceful degradation; short period annualization anomaly warnings. |
| **Debit Disruptions** | `debit-insufficient-balance`, `debit-upi-limit`, `debit-bank-unavailable`, `debit-mandate-expired`, `debit-timeout`, `debit-technical`, `debit-unknown`, `debit-no-reason`, `debit-recovered` | All 7 payment failure categories; active status guarantee; 1-tap retry; unverified retry suppression. |
| **Cash-Flow & Life** | `cashflow-pause`, `paused`, `cancelled`, `quarterly`, `multi-sip` | Pause lifecycle state machine; 6-month cap; 14-day restart pending; multi-SIP isolation. |
| **Data Edge Cases** | `missing-valuation`, `missing-instalments-gap`, `inconsistent-xirr`, `xirr-fails` | Upstream data resilience; bisection XIRR fallback; audit flags. |

---

## 5. Automated Verification & Quality Commands

All quality gates, unit tests, and production checks can be executed locally:

```bash
# 1. Run all 496 tests across 35 test files (100% green)
npm run test

# 2. Run the 40-Scenario Golden Set Evaluation
npm run test -- tests/unit/golden/golden-set.test.ts

# 3. Run Accessibility & WCAG 2.2 AA Contrast Audit
npm run test -- tests/unit/accessibility/accessibility.test.ts

# 4. Run TypeScript strict typecheck (0 errors)
npm run typecheck

# 5. Run ESLint 9 Flat Config (0 errors, 0 warnings)
npm run lint

# 6. Execute Production Build
npm run build
```

---

## 6. Observability & Health Check Endpoints

| Endpoint | Method | Response Highlights |
|---|---|---|
| `/api/v1/health` | `GET` | Returns HTTP 200 OK, `uptimeSeconds`, `timestamp`, `service: "sip-steady"`, configuration check, and safe LLM status. |
| `/api/v1/personas` | `GET` | Returns catalog of all 30 pre-configured research personas. |
| `/api/v1/sips/[id]/metrics` | `GET` | Pure domain returns engine metrics (invested, value, absolute return, XIRR). |
| `/api/v1/sips/[id]/coach` | `POST` | Return Coach structured narrative with anonymized audit logging. |
| `/api/v1/debit-events/[id]/explain` | `GET` | Rules-based debit triage and continuity status. |
| `/api/v1/sips/[id]/pause` | `POST` | Pause lifecycle calculation with boundary date checks. |
| `/api/v1/pauses/[id]/undo` | `POST` | 60-second undo window enforcement. |

---

## 7. Compliance Verification Checklist

- [x] **No Investment Advice:** Refusal intercept catches 100% of advice prompts; directs to SEBI RIA directory.
- [x] **No Urgency or Guilt Framing:** Zero countdowns, zero streak warnings, zero loss framing.
- [x] **Neutral Negative Return Styling:** Zero coral/red styling on negative or flat returns.
- [x] **Paise & Scaling Invariant:** Strict integer paise arithmetic; zero IEEE 754 float drift.
- [x] **Demo Data Disclosure:** All mock fixtures carry persistent `DEMO DATA` badge.
