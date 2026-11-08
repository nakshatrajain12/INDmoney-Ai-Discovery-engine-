Phase 2: Return calculation engine        Date: 2026-11-08        Reviewer: ____ (owner sign-off PENDING)

STATUS: engineering complete, NOT signed off. D-17 to D-22 approved by the owner (2026-11-08). D-16 band thresholds remain PROPOSED and D-15 final fixture sign-off remains pending; both need the owner (marked OWNER below).

Tasks
[x] money.ts: integer paise, BigInt percentages, Indian-grouping formatter (shared with Phase 3)
[x] returns.ts: invested (successful instalments only), absolute return in paise and %, half away from zero
[x] tenure.ts: months from first successful instalment, counts, stages M1 / M1_3 / M3_6 / M6_12 / OVER_12, all four frequencies
[x] xirr.ts: Decimal (decimal.js, 50 digits), bracketed Newton with bisection fallback, 365-day basis, tol 1e-9, 200 iterations, null on <2 flows / same-sign / one date / out-of-range
[x] Provider XIRR reconciliation with configurable tolerance and xirrMismatch flag
[x] classify.ts + rules/bands.v1.json (thresholds carry a status field)
[x] confidence.ts per architecture section 6.4 (precedence LOW > MEDIUM > HIGH)
[x] CLI: npx tsx scripts/calc.ts <persona> | --all | --json
[x] Independent verification vectors: tests/fixtures/xirr-vectors.json (16) and xirr-vectors.xlsx
[x] Lint-enforced purity: no I/O, no clock, no randomness, no data-layer or LLM imports in domain/returns and domain/confidence (tested)

Acceptance criteria
[x] Invested and absolute return match hand calculation on ten personas (engine.test.ts), and on all 32 SIPs against an independent Python implementation: 0 mismatches
[x] XIRR matches independent vectors; tolerance 0.0001 percentage points (engine rounds to 4 dp). Worst observed difference on the 32 persona SIPs: 0.000044 pp
[x] xirr returns null (never a number) for a single flow, same-sign flows, one date, out-of-range roots and the iteration cap
[x] Stage boundaries tested one day before, on, and one day after each boundary (1, 3, 6, 12 months), plus month-end clamping and leap years
[x] Failed, pending and skipped instalments never enter invested, even if corrupt data gives them a settlement date (mutation-checked)
[x] Daily, weekly, monthly and quarterly counts and tenure
[x] No domain/returns function performs I/O or imports from explain/ (ESLint rule plus lint tests)
[x] confidence returns HIGH / MEDIUM / LOW per the rule table (table-driven plus exhaustive combinations)

Owner's five pre-completion conditions
1. Engine independent of invented NAV: it never reads navE4, unitsE4, navHistory or currentNavE4. A test scrambles all NAV data for all 32 SIPs (results identical); a source scan confirms no references. [x]
2. Calculations verified against independently calculated expected values: Python (Fractions, scipy brentq, mpmath 50 digits), 32 SIPs, 0 mismatches; hand-calculated figures for ten personas hard-coded in tests; Microsoft's published XIRR example reproduced. [x]
3. XIRR failure genuinely fails for the documented reason: xirr-fails returns UNAVAILABLE_NOT_CONVERGED; with the upper bound opened to 1e15 the solver finds a root, proving the failure is the +10,000% bound and not missing data. Control: same-sign flows fail with a different status. [x]
4. Mock-data limitations explicit: see the section below, the fixture README, and the CLI banner. [x]
5. D-11 consistent: status.ts is the only place RESTART_PENDING is decided; the engine has no status field and ignores pause and reminder (tested); boundary tests at 13, 14 and 15 days. [x]

Tests executed (2026-11-08)
- npm run check: typecheck pass, lint pass, 343 tests in 19 files, all pass (Phase 1 had 156 in 14)
- npm run build: pass
- npm audit --omit=dev: 0 vulnerabilities
- tests/live/phase2-live-check.ts: 32 live checks pass (all 30 personas, integer paise, tenure stages, bisection XIRR, null handling, confidence scoring)
- python tests/fixtures/verify_personas.py: 32 SIPs, 0 mismatches (re-run after the RC-E2d change below)
- Mutation checks: counting FAILED instalments as invested, and changing a band comparison, were both caught by tests

MOCK-DATA LIMITATIONS (read before relying on any number)
- Every NAV is invented and every value derives from invented NAVs. All figures here demonstrate that the CALCULATION is correct; they say nothing about any fund or market.
- All 30 personas are designed test cases, not users and not research evidence. D-15 is provisionally accepted, NOT fully reviewed or signed off; fixtures were not edited in this phase.
- Independent XIRR values come from scipy and mpmath. No spreadsheet application was available, so Excel's XIRR function has NOT been run here. The one spreadsheet-origin value is Microsoft's documented example (0.373362535). xirr-vectors.xlsx contains live =XIRR() formulas for the owner to recalculate.
- Band thresholds are PROPOSED values (D-16), not research output and not approved.

Known issues and open items
- OWNER  D-16 band thresholds: still PROPOSED (owner: do not finalise yet). Review pack with every threshold, its classification, the explanation intent, boundary behaviour generated from the real engine, and 8 decision points: docs/band-thresholds-review.md. Notably, the engine treats exactly +/-0.50% as NOT flat while architecture 6.3 and edge-cases RC-E2b say |A%| <= tolerance is FLAT (inclusive); awaiting the owner's choice.
- DONE   D-17 to D-22 approved by the owner on 2026-11-08 (rounding, displayed-figure classification, stale valuation, dependencies, settlement dates, NAV independence). The NAV-scrambling regression test across all SIP fixtures is preserved and must stay.
- OWNER  D-15 final fixture sign-off after inspecting src/data/mock/README.md. NAV histories and MOCK_ payment codes stay explicitly labelled illustrative.
- OWNER  Optionally open tests/fixtures/xirr-vectors.xlsx in Excel and confirm column F equals column G (absence of Excel/LibreOffice is an acknowledged limitation, not a blocker)
- FIXED  Found while preparing the D-16 pack: a zero current value against money invested was classified NEGATIVE (-100%), contrary to edge-cases RC-E2d. Now flagged VALUATION_SUSPECT, value unavailable, INSUFFICIENT_DATA; test added. No fixture has a zero value, so persona results are unchanged.
- LOW    The returns engine does not detect schedule gaps (missing-instalments-gap); the fixture validator does. Phase 3 decides how a gap affects confidence.
- LOW    edge-cases RC-E4b (show stale figures at MEDIUM) conflicts with approved D-19 (treat as unavailable). D-19 governs the code; the document is not edited.
- LOW    Clickable prototype has no distinct RESTART_PENDING label (it applies the same <= 14 day rule to its "resumes" wording); Phase 6 maps the label.
- LOW    Full npm audit still shows 8 moderate in the dev ESLint chain (unchanged, documented in architecture.md section 17).

CLI verification (command executed 2026-11-08, exit code 0): npx tsx scripts/calc.ts early-flat
Actual output, recorded verbatim:
```
DEMO DATA. Illustrative NAVs, not market data. Rules: bands.v1 (PROPOSED_PENDING_OWNER_REVIEW)
Persona early-flat: Early small negative   as of 2026-11-08

early-flat_s1  Northstar Flexi Cap Fund  MONTHLY  ₹5,000.00 per instalment
  successful instalments (cash out):
    2026-06-15  ₹5,000.00
    2026-07-15  ₹5,000.00
    2026-08-15  ₹5,000.00
    2026-09-15  ₹5,000.00
    2026-10-15  ₹5,000.00
  not counted: none
  invested (I)            ₹25,000.00   (paid 5, failed 0, pending 0)
  current value (V)       ₹24,449.52
  absolute return (A)     -₹550.48   A% = -2.20%
  first successful date   2026-06-15   tenure 4 months / 146 days   stage M3_6
  XIRR                    -9.1433%   [OK]   annualised from a short period
  provider XIRR           -9.14%   reconciliation MATCH (diff 0 bps)
  situation               SMALL_NEGATIVE
  flags                   XIRR_ANNUALISED_SHORT_PERIOD
```
Comparison with the owner's hand calculation: invested 25,000.00, value 24,449.52, absolute return -550.48, displayed return -2.20%: all four match the CLI output. The command was run twice (before and after the RC-E2d change) and the output was byte-identical.

Decision: PENDING owner review. Phase 3 does not start until this gate is signed.
Notes: ____
