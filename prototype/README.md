# SIP Steady: INDmoney SIP Confidence and Recovery Experience

**NextLeap Graduation Project:** Advanced Product Engineering & System Architecture  
**Production Prototype:** Next.js `16.4.5` App Router · React 19 · TypeScript Strict · Tailwind CSS Design Tokens matching Stitch  
**Status:** **Production Ready (All Phases 0–9 Complete)**  
**Verification:** **35 test files, 496 tests passing (100% green)** · ESLint 9 (0 errors, 0 warnings) · `tsc --noEmit` (0 errors) · Next.js build clean  

> **DEMO DATA DISCLOSURE:** All personas, schemes, bank labels, and valuations are illustrative mock data fixtures. No real money moves, no live broker or bank accounts are accessed, and every screen is clearly badged **"DEMO DATA"**. The prototype complies strictly with SEBI (Investment Advisers) Regulations, 2013 by providing zero investment advice and zero market predictions.

---

## 1. What is SIP Steady?

First-year mutual fund investors frequently abandon SIPs due to:
1. **Return Ambiguity (Month 4–6 Churn):** Normal early market volatility causes negative paper returns, which investors mistake for permanent capital loss.
2. **Debit Drop-offs (Payment Failures):** A single auto-debit failure leads investors to believe their SIP was cancelled or penalties were charged.
3. **Cash-Flow Rigidity:** Investors cancel their entire SIP when facing a temporary cash squeeze because platforms make pausing difficult or guilt-inducing.

**SIP Steady** solves these root causes through three core product interventions:
- **Module 1: Return Coach:** Tenure-aware educational performance explanations using a 3-block narrative (*Your figures* $\rightarrow$ *What this means* $\rightarrow$ *What it does not mean*), verified AMFI/SEBI citations, and strict zero-digit bounded rephrasing.
- **Module 2: Rules-Based Debit Explainer:** 7-category plain-language payment failure triage confirming active SIP continuity, zero penalties, and 1-tap UPI retry.
- **Module 3: Pause & Restart Machine:** Equal-weight 3-way options matrix (Pause vs Reduce vs Cancel), duration selector (1, 2, 3, 6 months), calm opt-in restart reminders, and a 6-second undo window.

---

## 2. Quickstart & Local Execution

### Prerequisites
- Node.js `20.x` or `22.x`+
- npm `10.x`+

```bash
# Navigate to project directory
cd prototype

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser. (Recommended: Chrome DevTools set to mobile viewport: iPhone 15 Pro, 430×932).

### Production Verification Commands
```bash
# 1. Full regression test suite (496 tests, 35 files)
npm run test

# 2. 40-Scenario Golden Set Evaluation & Gate Verification
npm run test -- tests/unit/golden/golden-set.test.ts

# 3. Accessibility & WCAG 2.2 AA Contrast Audit
npm run test -- tests/unit/accessibility/accessibility.test.ts

# 4. Strict TypeScript compiler check
npm run typecheck

# 5. ESLint 9 Flat Config check
npm run lint

# 6. Production Build
npm run build && npm start
```

---

## 3. Observability & Health Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/health` | `GET` | Returns HTTP 200 OK, `uptimeSeconds`, `timestamp`, `service: "sip-steady"`, configuration check, and safe LLM status. |
| `/api/v1/personas` | `GET` | Catalog of all 30 research personas with expectation metadata. |
| `/api/v1/sips/[id]/metrics` | `GET` | Pure domain returns engine calculation (invested paise, valuation, XIRR). |
| `/api/v1/sips/[id]/coach` | `POST` | Return Coach 3-block narrative generation with anonymized audit logging. |
| `/api/v1/debit-events/[id]/explain` | `GET` | Debit triage and active status continuity confirmation. |
| `/api/v1/sips/[id]/pause` | `POST` | Pause lifecycle calculation and scheduling. |
| `/api/v1/pauses/[id]/undo` | `POST` | 60-second undo window enforcement. |

---

## 4. Key Architectural Invariants

1. **Integer Paise Financial Math:** Every currency value is stored and calculated as an integer number of paise (`1 INR = 100 paise`). IEEE 754 floating-point numbers are prohibited in currency arithmetic.
2. **Deterministic-First Core:** Financial metrics, debit triage, pause state machines, and template generation run with pure, deterministic TypeScript logic.
3. **Bounded Generative Edge:** The optional LLM rephraser never touches, alters, calculates, or outputs digits. A 14-rule regex and AST validator gate rejects any output with digit drift.
4. **Zero Investment Advice (SEBI RIA Boundary):** The intent guard deterministically refuses 100% of advice, stock/fund recommendation, market recovery, and market timing prompts, redirecting users to SEBI-registered advisers.
5. **Calm Visual Hierarchy (Zero Coral for Market Drops):** Negative or flat returns use neutral typography (`#F8FAFC` dark / `#0F172A` light). Red/coral styling is restricted strictly to destructive or cancelled actions.
6. **Accessible Ergonomics:** All interactive buttons and link targets enforce $\ge 44 \times 44$ px sizing; contrast ratios satisfy WCAG 2.2 AA in both light and dark themes.

---

## 5. Walkthrough & Evaluation Guide

For a detailed step-by-step evaluation guide covering all 30 personas, interactive journeys, and grading criteria, see:
👉 **[`docs/prototype-walkthrough-guide.md`](docs/prototype-walkthrough-guide.md)**
