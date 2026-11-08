Phase 1: Data models and mock SIP data        Date: 2026-11-08        Reviewer: ____ (owner sign-off pending)

[x] All tasks complete (seed script and migrations not applicable: no database, D-03)
[x] Acceptance criteria met (evidence in docs/implementation-log.md)
[x] Tests green: typecheck, lint, 156 unit tests in 14 files, production build, 32 live API checks
[x] Independent verification: Python re-derivation of invested amounts, units, values, returns and XIRR, 0 mismatches
[x] Every record labelled DEMO DATA; fictional schemes and bank only
[x] Documents updated (decisions, implementation log, PROJECT-STATE, fixture README)

Known issues
- CLOSED D-11 RESTART_PENDING: APPROVED by owner (2026-11-08). Paused AND a valid restart date present AND restart 14 calendar days or fewer away. Open-ended pauses never qualify; a restart reminder alone never qualifies.
- OPEN   D-15 mock fixtures: PROVISIONALLY ACCEPTED by owner, NOT fully reviewed or signed off. Final fixture sign-off is pending the owner's inspection of src/data/mock/README.md. Fixtures are preserved unchanged and may be used provisionally for Phase 2. NAV histories are illustrative (never real market data); MOCK_ reason codes are simulated.
- LOW    xirr-fails was redesigned after my own independent check showed the first version did not fail

Decision: PASS. D-11 approved. D-15 provisionally accepted (fixture review pending). Owner authorised Phase 2 to proceed using the current fixtures provisionally.
Notes: ____
