# Prototype QA Report: SIP Steady clickable prototype

**Date:** 2026-11-08 · **Scope:** `clickable-prototype/clickable/` (index.html, styles.css, app.js), checked against `product-requirements.md`, `user-flow.md`, `edge-cases.md` and `design-system.md`.
**Verdict:** **Ready to move to implementation**, with the open items in §6. All critical and high findings were fixed and re-verified. Nothing in this report is based on real users; see §5 for what cannot be established without them.

## 1. How the review was done

| Method | What it covered |
|---|---|
| Instrumented audit (`tests/prototype-e2e/audit.js`, Playwright + Chromium) | Clicked **every** `data-act` control on 22 screen states (dead-end and no-op detection); scanned all screen text for terminology and advice patterns; recomputed every figure; re-implemented XIRR independently; ran **axe-core 4.14.0** (WCAG 2.0/2.1/2.2 A and AA plus best-practice rules) on every screen in dark and light mode; measured control sizes; tested focus behaviour and browser Back; scanned for currency leaks with "hide amounts" on |
| Journey suite (`tests/prototype-e2e/journeys.js`) | Journeys A, B, C end to end, error, loading and empty states, theme persistence, plus **15 regression checks added for the findings below** |
| Visual review | Screenshots of 19 screens in both themes (`clickable-prototype/screens/clickable-prototype/`), reviewed by eye for hierarchy, wrapping and overlap |
| Heuristic review | Terminology, information hierarchy, comprehension, advice risk, status distinguishability |

**Limits.** The automated accessibility scan catches only a share of real problems. The comprehension question (§4, item 8) needs real users. No tests ran on real devices, Safari, Firefox, or a screen reader.

## 2. Result summary

| Area | Before | After |
|---|---|---|
| Navigation: dead ends | 0 | 0 |
| Crashes / console errors | 1 crash (Undo pause) | 0 |
| axe violations (22 screens × 2 themes) | 110 findings (94 low-contrast elements; 88 landmark-nesting), none critical | **0** |
| Controls below 44 px | 27 | **0** |
| Advice-pattern phrases found | 5 | **0** |
| Figure mismatches between screens | 0 real (4 were an audit artefact, see QA-24) | 0 |
| XIRR vs independent solver | n/a | All 6 SIPs agree to < 0.01 pp |
| Browser Back | Left the prototype | Stays inside |
| Focus management | None | Screen, sheet and return-to-trigger |
| Journey and regression checks | 58 checks | **73 checks, all pass** (15 added for these findings) |

## 3. Findings and fixes

Severity: **Critical** = breaks a journey or a safety rule · **High** = significantly harms users or compliance · **Medium** = clear usability or consistency problem · **Low** = polish.

| ID | Sev | Area | Finding | Fix | Verified by |
|---|---|---|---|---|---|
| QA-01 | **Critical** | Navigation / error | **Undo pause crashed.** The toast re-rendered the Pause-confirmation screen after `pause` was cleared, throwing `Cannot read properties of null`. Undo never completed and the UI froze. Not caught by the original journey tests. | Navigate first, then toast; null-guards on every pause screen with a "This SIP is not paused" fallback | Regression test; audit shows 0 page errors |
| QA-02 | **Critical** | Status clarity | A failed instalment was shown as the SIP's own status ("Debit failed", coral) while the SIP was actually active. Paused and failed shared amber. A user could read "failed" as "cancelled". Three different labels were used for the same event (failed / unsuccessful / didn't go through / missed). | One vocabulary: event = **Instalment failed**; SIP chip = **Active · 1 failed instalment** (amber, alert icon); **Paused** = blue with pause icon; **Cancelled** = coral with x; "What the labels mean" legend on SIP management | Regression tests on chip classes; legend present |
| QA-03 | **Critical** | Advice | Button labels **"Keep SIP active (cancel)"** and **"Keep SIP"** nudged toward continuing, which breaks the "no leaning" rule even though no sentence was advice. | Neutral labels: "Go back without pausing" and "Go back" | Advice scan: 0 matches |
| QA-04 | **Critical** | Privacy | **"Hide amounts" leaked** rupee figures in explanation text, toasts, buttons and follow-up answers while hiding the cards. | All currency formatting goes through masked helpers; text templates use them | Regression test: no `₹` figure on the Coach screen when hidden |
| QA-05 | High | Navigation | Browser Back left the prototype (to the previous site). | History API: each screen pushes state; Back pops one screen and never leaves | Test: Back returns to the previous screen |
| QA-06 | High | Accessibility | No focus management: focus stayed on `<body>` after navigation; sheets did not take or return focus; no Tab trap; static page title; no announcement of screen changes. | Focus moves to the screen on navigation; sheets focus on open, trap Tab, close on Escape and return focus to the trigger; page title per screen; polite live region announces the screen | Audit: active element = `screen`, sheet focus true, returned true, title changes, live region present |
| QA-07 | High | Accessibility | **Contrast failures on every screen** (94 elements): demo banner 4.47, muted text 3.66 / 4.05, link on surface-2 4.18, coral chip 4.25. | Dark muted `#8896AB`, light muted `#5A6A7F`, dark link/info text `#60A5FA`, dark coral text `#F4806A`; `design-system.md` updated | axe: 0 contrast violations in both themes |
| QA-08 | High | Accessibility | 27 interactive controls under 44 px (icon buttons 40 px, filter pills 34 px, small buttons 36 px, toggles 28 px). | 44 px minimum everywhere; toggles get an extended hit area | Audit: 0 controls under 44 px |
| QA-09 | High | Accessibility | `role="application"` on the wrapper put the header and main inside another landmark; some content outside landmarks; heading hierarchy skipped levels; `listitem` without a list; radio options without a group. | Wrapper is a plain element; demo notice is an `aside`; headings use a consistent level scheme; non-interactive rows are plain; radio groups labelled | axe: 0 violations |
| QA-10 | High | Comprehension / safety | A short-tenure XIRR (−9.14% at 146 days) was shown as an unqualified headline chip beside a −2.2% return, which can alarm and confuse (edge case RC-E3b). | Labelled "XIRR (annualised)" everywhere; a one-line caveat under the chip when the SIP is under a year old; term sheet explains why. **Owner decision still open (§6).** | Visual check; text scan |
| QA-11 | High | Hierarchy | On the failed-instalment screen the only action sat below about 1000 px of content. | "What to do next" card with the primary button directly under the failure and retry cards; duplicate block removed | Screenshot review |
| QA-12 | High | Comprehension | The Coach started with a table of numbers; the plain-language answer was in Block 2, below the fold. | New **"In short"** card at the top; Block 2 text rewritten with plain-language glosses | Flesch reading ease of the explanation text: **89.7** (very easy, heuristic only) |
| QA-13 | Medium | Terminology | Inconsistent labels: "Net return / Net movement / Absolute return / Return"; "Restarts / Resumes / Restarted"; "Avg purchase NAV"; "Failed debit" vs "Failed instalment". | Glossary applied: **Return** (with "Return (absolute)" for the term chip), **XIRR (annualised)**, **Resumes**, **Average price per unit you paid**, **Failed instalment** | Terminology count: `unsuccessful` 0, `missed` 0, `net return` 0, `net movement` 0 |
| QA-14 | Medium | Comprehension | Jargon used before it was explained ("units", "NAV"). | Inline glosses: units = small slices of the fund; NAV = price of one unit | Text review |
| QA-15 | Medium | Navigation | Instalment rows on a SIP's own page linked back to the same page (no-op). | Rows are plain; only the failed row links | Dead-click scan |
| QA-16 | Medium | Error states | Silent no-ops: submitting an empty follow-up; trying to remove the last reminder channel. | Inline messages for both | Regression test |
| QA-17 | Medium | Navigation | A back arrow appeared on screens with nowhere to go. | Shown only when there is history; `back()` falls back to the dashboard | Audit |
| QA-18 | Medium | Demo | Journey "Start" did not reset data, so a journey could not be replayed. | "Start" resets data (keeps theme) | Manual check |
| QA-19 | Medium | Advice | Suggested question "What happens if I stay invested for 3 years?" implied staying invested. | "What will my SIP be worth in 3 years?" (still demonstrates the prediction refusal) | Test: refused |
| QA-20 | Medium | Advice | Phrases "None is recommended" and "stay invested" appeared in Pause screens. | Rewritten ("All three are equal options"; "Units you already hold are not sold") | Advice scan |
| QA-21 | Medium | Error states | No failure state for **confirming a pause**. | New simulated "pause request fails" with an inline error, nothing changed, retry, and a busy overlay while pending | Regression test |
| QA-22 | Low | Accessibility | Section titles were not headings; "What do you want to do" options had no group name. | `role="heading"` levels and a labelled radiogroup | axe |
| QA-23 | Low | Privacy | The Reduce screen shows "Demo minimum ₹500" while amounts are hidden. | Accepted: it is a product rule, not a balance. Revisit if the rule is dynamic | n/a |
| QA-24 | Low | Audit tooling | Four "missing figure" alarms were caused by the audit leaving "hide amounts" on. | Audit now resets it | Re-run: 0 figure mismatches |

## 4. Review against your ten questions

1. **Navigation paths.** Every control on 22 screen states has a handler and a visible result or an intended no-op (re-selecting the current item). No screen is a dead end; each has a back arrow or the bottom navigation. The three journeys complete and the Demo guide ticks each step (re-verified after the fixes). Browser Back now works.
2. **Missing screens.** None blocks the journeys. Gaps, all Low: reduce, cancel and resume end with a toast then the SIP management list rather than a dedicated success screen; Explore is a labelled placeholder by design; there is no SIP-detail layout specific to a paused SIP (the status line, ledger "Skipped (paused)" rows and the management card cover it); Hindi/Hinglish is out of scope.
3. **Inconsistent terminology.** Fixed (QA-02, QA-13). The glossary to keep in the product: *Instalment failed · Active · Paused · Cancelled · Return · Return (absolute) · XIRR (annualised) · Resume (action) / Resumes (date) · Restart reminder (feature) · Autopay mandate.* "Instalment" is British spelling throughout (54 uses, 0 of "installment").
4. **Financial figure consistency.** Verified programmatically: every SIP's invested amount, value, return and percentage match across the dashboard, SIP detail, Coach entry, Coach and management screens; the portfolio value ₹69,411 equals the sum of the individually rounded SIP values; return = value − invested to the rupee for all SIPs; the monthly commitment ₹10,000 = ₹5,000 + ₹4,000 + ₹1,000; after the demo payment Harbor shows ₹20,000 invested; **XIRR matches an independent Newton solver for all six SIPs**. Caveat: these are mock data.
5. **Information hierarchy.** Improved: the Coach opens with "In short"; the failed-instalment next step is above the fold; status chips follow one scheme with a legend. Remaining watch item: the Coach is still long (about 3200 px on a phone at the tallest state, with the follow-up thread open). It reads well top to bottom, but usability testing should check whether people scroll to the sources and follow-up.
6. **Accessibility.** axe-core: 0 violations on 44 screen/theme combinations; targets ≥ 44 px; contrast fixed; focus, titles, announcements, Escape and a Tab trap added; reduced motion respected; status never colour-only. **Not covered:** a real screen-reader pass, 200% text scaling, keyboard testing on Safari/Firefox, voice control.
7. **Error states.** Present and exercised: network failure with retry; payment failure with no invented reason; unknown provider reason; pause failure with nothing changed; form validation (dates, amounts, empty questions, reminder timing); empty states (inbox, failed filter, SIP filters); not-sure state (one instalment). Missing, by design: offline mode (X-E9) and rate limiting.
8. **Do users understand the Return Coach?** *Heuristic evidence only.* The explanation text scores 89.7 on Flesch reading ease (very easy; heuristic), jargon is glossed inline, the answer comes first, and a "what it does not mean" block guards against over-reading. **This cannot be confirmed without users.** Run the comprehension test in §6 before treating it as validated. Watch for: whether −9.14% XIRR still alarms people; whether "not a reason to act in either direction" is read as neutral or as discouraging; whether the follow-up refusal feels helpful or evasive.
9. **Failed vs paused vs cancelled.** Now distinguished by label, icon and colour in the dashboard card, SIP detail, SIP management and the ledger, with a legend: Active (green check); Active · 1 failed instalment (amber alert); Paused (blue pause); Cancelled (coral x); the ledger separates "Failed", "Skipped (paused)" and "Processed". Automated checks assert the chip colours. **Untested with users:** whether "Active · 1 failed instalment" is understood on first read.
10. **Accidental investment advice.** Scanned all 22 screens for 25+ advice patterns (should, recommend, stay invested, keep, good time, will recover, etc.): 0 remain. Three label-level leans were removed (QA-03, QA-19, QA-20). Prediction and advice questions get the fixed refusal. Remaining judgement calls for compliance review: "Units you already hold are not sold" (a factual statement about the product, flagged "demo rule"), and the unverified-consequence tags, which stay visible.

## 5. What QA cannot establish
- **Comprehension and trust** (Coach clarity, whether refusals feel respectful, whether the reminder feels calm): needs 5 to 8 moderated sessions with first-year investors.
- **Screen-reader and cross-browser behaviour** beyond the automated tests.
- **Real data behaviour**: reason codes, pause capabilities, fee rules.
- **Effect on retention**: the prototype demonstrates an experience, not an outcome.

## 6. Open items before and during implementation

| # | Item | Owner | Why it matters |
|---|---|---|---|
| 1 | Decide whether XIRR is shown at all under 12 months, or only in the term sheet (edge case RC-E3b recommends not headlining it) | Product | QA-10 is mitigated, not removed |
| 2 | Set the demo thresholds (flat ±0.5%, small-negative −5%, minimum ₹500, maximum pause 12 months) | Product | Placeholders today |
| 3 | Run a comprehension test: 5 to 8 first-year investors; tasks: "What does this screen say about your SIP?", "Is your SIP cancelled?" (on a failed-instalment card), "Is this advice?" | Research | Closes §4 items 8 and 9 |
| 4 | Screen-reader pass (NVDA + Chrome, VoiceOver + Safari) and 200% zoom | QA | Automated checks are not enough |
| 5 | Compliance read of every string, especially the refusal text and "Units … are not sold" | Legal | Safety |
| 6 | Real source library to replace the demo placeholder (confidence is MEDIUM until then) | Content | PRD RC-7, RC-8 |
| 7 | Add a dedicated success screen for resume / reduce / cancel if testing shows the toast is missed | Design | QA-low |
| 8 | Carry the audit into CI (`tests/prototype-e2e/audit.js` fails on any dead control, axe violation, advice phrase, undersized target or console error) | Engineering | Prevent regressions |

## 7. Files changed by this QA pass
`clickable-prototype/clickable/app.js`, `styles.css`, `index.html`; `docs/design-system.md` (token and chip-semantics updates); new `tests/prototype-e2e/audit.js`, `contrast.js`, `audit-final-result.json`; updated `journeys.js` (15 new regression checks) and `clickable-prototype/screens/clickable-prototype/*.png` (recaptured).
