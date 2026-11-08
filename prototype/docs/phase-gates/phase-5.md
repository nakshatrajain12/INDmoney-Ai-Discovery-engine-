# Phase 5: Module 3 — Pause & Restart State Machine

**Date:** 2026-11-09  
**Reviewer:** Owner Sign-off Pending  
**Status:** Engineering Complete. All Phase Gate 5 Acceptance Criteria Met.

---

## 1. Tasks Summary

| Task | Status | Implementation Details |
|---|---|---|
| **Contracts Definition (`src/contracts/pause.ts`)** | Complete | Zod schemas and TypeScript types for 3-way Options Comparison, Pause Lifecycle States, Pause & Resume requests/responses, and Calm Reminder payloads. |
| **Options Comparison Logic (`src/domain/pause/options.ts`)** | Complete | Pure, deterministic function `getOptionsComparison` comparing **Pause**, **Reduce Amount (Step-Down)**, and **Cancel** with explicit consequences for each (mandate continuity, compounding, zero fees, recovery). |
| **Pause Lifecycle State Machine (`src/domain/pause/machine.ts`)** | Complete | Evaluates transitions: `ACTIVE` $\rightarrow$ `SCHEDULED_PAUSE` $\rightarrow$ `PAUSED` $\rightarrow$ `RESTART_PENDING` $\rightarrow$ `RESUMED` / `CANCELLED`. Includes validation and clamping functions (`canTransition`, `validateTransition`, `calculatePauseDates`, `getPauseLifecycleState`). |
| **Mandate Status Preservation** | Complete | Confirmed that pausing an active SIP strictly preserves the underlying bank mandate status (`mandate.status === 'ACTIVE'`). |
| **Date Boundaries & Edge Cases (PR-E01 to PR-E10, PR-E14)** | Complete | Handled all edge cases: past start date rejection (PR-E01), invalid end date rejection (PR-E02), zero-debits window warning (PR-E03), in-flight processing notice (PR-E04), 6-month max platform cap (PR-E05), duplicate pause 409 conflict (PR-E06), cancelled SIP resumption refusal (PR-E08), mandate expiry warning (PR-E09), instant 60s undo (PR-E10), and derived 14-day `RESTART_PENDING` state (PR-E14). |
| **Opt-in Calm Reminder Scheduler (`src/domain/pause/reminders.ts`)** | Complete | Factual notification generator enforcing default off (PR-E11), non-urgent factual copy offering equal choices (*Resume*, *Extend*, *Keep Paused*) without guilt or streak warnings (PR-E12), and pre-send purge for resumed/cancelled SIPs (PR-E13). |
| **Pressure-Language & Banned-Phrase Compliance** | Complete | All copy in options and reminders scanned against `src/lib/banned-phrases.ts` with 0 violations. |
| **Data Provider Extensions** | Complete | Implemented `pauseSip`, `resumePause`, and `undoPause` on `SipDataProvider` and `MockProvider`. |
| **API Endpoints** | Complete | `GET /api/v1/sips/[id]/options`, `POST /api/v1/sips/[id]/pause`, `PATCH /api/v1/pauses/[id]/resume`, and `POST /api/v1/pauses/[id]/undo`. |
| **Unit & Integration Tests** | Complete | `tests/unit/pause/state-machine.test.ts` (17 tests), `tests/unit/pause/options.test.ts` (2 tests), `tests/unit/pause/reminders.test.ts` (3 tests), `tests/unit/pause/api.test.ts` (13 tests). |

---

## 2. Phase Gate 5 Checklist Verification

- [x] **State machine handles all valid and invalid transitions cleanly.**  
  Verified by `tests/unit/pause/state-machine.test.ts` and `tests/unit/pause/api.test.ts`. Transitioning from `CANCELLED` is blocked with HTTP 409 Conflict (*"This SIP has been permanently cancelled and cannot be resumed"*). Attempting to duplicate-pause an already paused SIP is blocked with HTTP 409 Conflict (*"This SIP is already paused until [Date]"*). 14-day `RESTART_PENDING` derives dynamically.
- [x] **Pausing an active SIP properly preserves the mandate status.**  
  Verified that setting up a scheduled or active pause preserves `sip.mandate.status === 'ACTIVE'`.
- [x] **Reminder copy passes the banned-phrase linter with 0 violations.**  
  All copy in `options.ts` and `reminders.ts` verified against `findBannedPhrases` with 0 violations. Zero guilt, zero FOMO, and zero streak warnings.
- [x] **Architectural boundary intact.**  
  `src/domain/pause/` contains zero LLM imports; verified by `tests/unit/architecture-boundary.test.ts` and ESLint.

---

## 3. Test Evidence

- `npx tsc -p prototype/tsconfig.json --noEmit`: **0 errors**.
- `npm run lint`: **0 errors, 0 warnings**.
- `npm test`: **442 tests passing across 30 test files** (100% green).
- `npm run build`: **Next.js production build succeeded** with all dynamic endpoints compiled.

