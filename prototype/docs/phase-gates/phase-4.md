# Phase 4: Module 2 — Rules-Based Debit Explainer

**Date:** 2026-11-09  
**Reviewer:** Owner Sign-off Pending  
**Status:** Engineering Complete. All Phase Gate 4 Acceptance Criteria Met.

---

## 1. Tasks Summary

| Task | Status | Implementation Details |
|---|---|---|
| **Rules Matrix (`debit-rules.v1.json`)** | Complete | Structured rules matrix in `src/rules/debit-rules.v1.json` defining diagnostic mappings for all 7 failure categories: `UPI_DAILY_LIMIT`, `INSUFFICIENT_FUNDS`, `BANK_UNAVAILABLE`, `MANDATE_EXPIRED`, `MANDATE_REJECTED`, `NETWORK_TIMEOUT`, and `GENERIC_UNKNOWN`. |
| **Contracts Definition** | Complete | Zod schemas and TypeScript types in `src/contracts/debit.ts` for categories, status chips, diagnoses, actions, and retry payloads. |
| **Debit Engine Evaluator** | Complete | Pure, deterministic function `evaluateDebitEvent` in `src/domain/debit/evaluator.ts` converting raw provider error codes to plain human explanations, active status confirmations, and single next best actions. |
| **Mandate Status Confirmation** | Complete | Confirmation that failed debits never display the SIP as cancelled unless the mandate is explicitly revoked or rejected by the issuing bank (`MANDATE_REJECTED` or mandate status `INACTIVE`). |
| **Corner Case DE-E06 (Conflicting Signals)** | Complete | Detects conflicting provider codes and messages (e.g. insufficient funds code with bank down message), discards conflicting text, and routes safely to generic unconfirmed fallback. |
| **Corner Case DE-E07 (Idempotency)** | Complete | In-memory cache debounces repeated retry requests using `idempotencyKey` to prevent duplicate deductions. |
| **Corner Case DE-E08 (Scheduled Auto-Retry)** | Complete | Reports automated bank retry date while allowing immediate manual retry when permitted. |
| **Corner Case DE-E09 (Already Settled)** | Complete | Rejects retries on already settled instalments with HTTP 409 Conflict: *"This instalment has already been successfully paid. Your account is up to date."* |
| **Corner Case DE-E10 (In-Flight Debits)** | Complete | Disables retry button and displays in-progress status notice when transaction is `PENDING`. |
| **Corner Case DE-E11 (Consecutive Failures)** | Complete | Detects 3+ consecutive failures and surfaces verified notice with `VERIFY_MANDATE` primary action. |
| **Pressure-Language Linter** | Complete | Scanned all human reasons, status details, action buttons, and consequence texts through `src/lib/banned-phrases.ts` with 0 violations. |
| **Data Provider Extensions** | Complete | Added `getDebitEvent` and `retryDebitEvent` to `src/data/provider.ts` and `src/data/mock/MockProvider.ts`. |
| **API Endpoints** | Complete | `GET /api/v1/sips/[id]/debit-events`, `GET /api/v1/debit-events/[id]/explain` (with alias `/explanation`), `POST /api/v1/debit-events/[id]/retry`. |
| **Unit & Integration Tests** | Complete | `tests/unit/debit/debit-rules.test.ts` (18 tests), `tests/unit/debit/api.test.ts` (14 tests). |

---

## 2. Phase Gate 4 Checklist Verification

- [x] **Every mapped error code generates the correct human explanation and status chip.**  
  Verified by `tests/unit/debit/debit-rules.test.ts` across all 7 categories and provider reason code aliases (`MOCK_UPI_DAILY_LIMIT_EXCEEDED`, `MOCK_INSUFFICIENT_BALANCE`, `MOCK_BANK_SERVER_UNAVAILABLE`, `MOCK_MANDATE_EXPIRED`, `MOCK_PAYMENT_TIMEOUT`, `MOCK_TECHNICAL_FAILURE`).
- [x] **Unmapped or unknown error codes trigger the safe fallback without failing.**  
  Verified across unmapped codes (e.g. `PSP_ERR_77`, `RANDOM_CODE_999`, `null`, `undefined`, empty string). All fall back to `GENERIC_UNKNOWN` with plain message *"We could not confirm the exact bank failure code."* and amber active status chip.
- [x] **Confirmation that a failed debit never displays the SIP as cancelled unless the mandate is explicitly revoked.**  
  Verified that standard failures (balance, limit, bank unavailable, timeout, unmapped) strictly confirm the SIP as `Active · 1 failed instalment`. Coral cancellation chip is only assigned if `MANDATE_REJECTED` or mandate status is explicitly `INACTIVE`.
- [x] **Zero pressure, urgency, or guilt language.**  
  All copy passed `findBannedPhrases` with 0 violations.
- [x] **Architectural boundary intact.**  
  `src/domain/debit/` contains zero LLM imports; verified by `tests/unit/architecture-boundary.test.ts`.

---

## 3. Test Evidence

- `npx tsc -p prototype/tsconfig.json --noEmit`: **0 errors**.
- `npm run lint`: **0 errors, 0 warnings**.
- `npm test`: **407 tests passing across 26 test files** (100% green).
- `npm run build`: **Next.js production build succeeded**; all static and dynamic route handlers compiled.

