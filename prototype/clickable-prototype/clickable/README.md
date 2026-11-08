# SIP Steady: clickable prototype

Open `index.html` in a browser (double-click works; no install, no server, no network calls other than the Inter web font, which falls back to system fonts offline).

**Mock data only.** Fictional funds, a fictional bank, invented figures. No real account is connected and no money moves. There is **no AI model** in this prototype: every sentence is a template filled with figures calculated in the page (returns, XIRR, tenure, debit rules, pause logic), following the deterministic-core design in `docs/architecture.md`.

## Journeys (all buttons work; each has a checklist in the Demo guide panel)

| Journey | Path |
|---|---|
| **A: Return confusion** | SIP Dashboard → "What does my Northstar return mean?" → select SIP → Explain my returns → Return Coach (figures, what it means, what it does not mean) → expand XIRR → ask a follow-up (chips or typed; advice and prediction questions get a fixed refusal; unknown questions get "not sure") → return to dashboard |
| **B: Failed debit** | SIP Dashboard → Recent instalments → failed instalment (or View ledger) → failure reason → SIP status → next step (pay manually, sheet, success; or wait; or manage mandate) → return to dashboard |
| **C: Pause and restart** | SIP Dashboard → Manage SIPs → Manage / Pause on a SIP → choose Pause (none preselected) → pick duration or custom dates (validated) → review → confirm → optional restart reminder (off by default; one message at a time you choose) → updated SIP status |

Also working: SIP detail, ledger filters, SIP management filters, reduce amount, cancel, resume early, change pause dates, mandate renewal, inbox, account (theme, hide amounts, reset), Explore (explains it is out of scope).

## States
Loading skeletons, empty states (no failed instalments, empty inbox, empty filters), error state with retry, success states (payment, pause, reminder, resume), and a "not sure" state (SIP F has only one instalment).

## Demo controls (right panel on desktop; gear button on phones)
Demo clock (jump to the reminder or restart date), simulate network error, slow network, next payment fails, choose the provider's failure reason (including an unknown one), theme, reset.

## Dark and light mode
Dark by default; the choice is stored under `ind_theme` (same key as the AI engine). Tokens come from `docs/design-system.md`, including the AA-passing light-mode text colours.

## How this differs from the generated screens (`../screens/stitch_*.zip`)
The layout, hierarchy and flows follow the generated screens. Content was changed where it broke the PRD:

| Generated screen | Prototype |
|---|---|
| "Across historical 5-year equity SIP cohorts, 38% of accounts showed flat or negative returns…" | Removed: an unsourced statistic |
| "Missing one instalment does NOT cancel your SIP or incur fund house penalties"; "No penalty or charges"; "100% safe"; "Zero Lock Penalty" | Removed. Consequences appear only as "demo rule, unverified"; "Will I be charged?" answers "I don't have verified information" |
| "Keep ₹4,000 … by 11 Nov, 11:59 PM", "Response < 5 mins" | Neutral wording; no deadline or response-time promise |
| Pause SIP pre-selected; "Optimal notice / Recommended" reminder timing; large "Resume SIP Now" button | Nothing pre-selected; no recommendation; resume is one of three equal actions |
| "Timing early SIP instalments interrupts cost averaging" | Removed: leans toward advice |
| Real fund names, inconsistent figures | Fictional funds; one consistent dataset |
| Source "AMFI study 2014–2024 verified 08 Nov 2026" | Honest "demo placeholder" source, confidence shown as MEDIUM because sources are unverified |

## QA
A full QA pass is in `../../docs/prototype-qa-report.md` (24 findings, all critical and high fixed). Re-run the checks with `../../tests/prototype-e2e/` (`journeys.js` for journeys and regressions, `audit.js` for dead controls, figures, advice patterns, accessibility, target sizes and focus).

## Known limits
- Tested in headless Chromium only (see `../../tests/prototype-e2e/`). Not tested on real devices, Safari or Firefox, and not tested with a screen reader.
- Demo thresholds (flat band ±0.5%, small-negative −5%, minimum reduced SIP ₹500, 12-month maximum pause) are placeholders for the owner to set.
- Debit reason categories are illustrative; real provider codes, retry rules, pause capabilities and fee rules are not verified.
- The source library is a placeholder; no real AMFI, SEBI or fund-house document is cited.
- Fictional "Demo Bank" and the INDmoney-style wordmark are text only; no INDmoney logo or real branding is used.
