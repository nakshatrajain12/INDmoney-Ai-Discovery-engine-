# User Flow: SIP Steady Prototype

**Status:** Draft v1 · **Date:** 2026-11-08 · **Inputs:** `problem-statement.md`, `research-context.md`, `product-requirements.md` (RC-, DE-, PR- IDs), `architecture.md`, `design-system.md`.

**Scope.** The three modules for first-year investors, running on **mock data** (every screen carries a "Demo data" chip). Flows describe behaviour and states, not final copy; all user-facing text is subject to content and compliance review.

**Design rules that apply to every flow** (from the PRD and design system)
- Calm and factual. No urgency, loss framing, countdowns, streaks or guilt.
- Never advice. "Explains your SIP figures. Not investment advice." is visible on Coach surfaces.
- Every explanation shows a source and a confidence label; "I'm not sure" is a designed state.
- Nothing is pushed in R1 except a reminder the user explicitly opted into.
- A flat or negative return is shown with its sign in normal text colour, never in alarm colour.
- Both dark and light mode, with the same flow and content.

**Who the flows serve [F from research]:** Uncertain Newcomers (first-year, unsure about returns; e.g., P01's situation), investors with a failed debit (e.g., P03), and investors with a cash-flow squeeze (e.g., P02). Confident continuers (e.g., P04) must be left alone.

---

## 1. Entry points and navigation map

```
Launch ─▶ [Demo: choose persona] ─▶ SIP LIST ─▶ SIP OVERVIEW (hero, status, actions)
                                                   │
        ┌──────────────────────────┬───────────────┴──────────────┬──────────────────────┐
        ▼                          ▼                              ▼                      ▼
  RETURN COACH               DEBIT EXPLAINER                PAUSE & RESTART          ABOUT / HOW IT WORKS
  (on request only)    (from a failed/missed row           (from "Manage SIP")
                         or a notice)
```

| Entry | From | Module |
|---|---|---|
| "What does this mean?" link next to the return figure | SIP Overview | Return Coach |
| "Is this normal?" button (always available, never pushed) | SIP Overview | Return Coach |
| Tap a term (XIRR, absolute return) | Any screen showing it | Term sheet (Coach) |
| Failed or missed instalment row / failure notice | SIP Overview, notification | Debit Explainer |
| "Manage SIP" → Pause | SIP Overview | Pause and Restart |
| Reminder message (only if opted in) | In-app inbox | Pause and Restart (resume/extend/leave) |
| Theme toggle | Header, every screen | Global |
| Demo panel (flag) | Header | Demo only |

**Not entry points in R1 [REQ]:** push or banner nudges into the Coach; any prompt shown to positive-return or quiet users.

---

## 2. Global flows

### 2.1 Theme (dark and light)
```
First visit ─▶ saved choice? ─ yes ─▶ apply saved ("ind_theme")
                  │ no
                  └──▶ default dark (system preference only if the owner confirms) ─▶ render without flash
Toggle ─▶ switch mode ─▶ persist ─▶ same screen, same state, same scroll position
```
States: dark, light. Success: the user's place is kept; no content changes.

### 2.2 Persona and demo clock (prototype only)
```
Open app ─▶ Persona list (early-flat, positive, debit-upi-limit, …) ─▶ select ─▶ SIP List
Demo panel ─▶ set "today" / force failure reason / toggle LLM ─▶ screens update
```
Every screen shows "Demo data". Real data is never requested.

### 2.3 Error and loading (applies to every screen)
```
Request ─▶ loading skeleton ─▶ success ─▶ render
                         └──▶ failure ─▶ standard SIP view + "Not-sure" card (neutral colour, plain text, support/help link)
```
No blank screen, no alarm colour for system errors, no partial explanations.

---

## 3. MODULE 1: RETURN COACH (priority)

### 3.1 Primary flow

```
SIP OVERVIEW
  hero: invested, current value, return, XIRR (as in account), tenure chip
  │
  ├─ user taps "What does this mean?" / "Is this normal?"
  ▼
[Load] ─▶ API: compute figures, tenure, situation, confidence, sources
  │
  ├─ situation = INSUFFICIENT_DATA / missing valuation / unsupported ─▶ F1 NOT-SURE
  │
  ▼
RETURN COACH SCREEN
  1. Your figures            (invested · current value · return · XIRR · tenure — tabular numerals)
  2. What this means at month N
  3. What it does not mean
  4. Terms (chips: XIRR · Absolute return · NAV …)  ─▶ tap ─▶ TERM SHEET (definition + source) ─▶ close ─▶ focus returns
  5. Sources (title · publisher · date)             ─▶ tap ─▶ opens source
  6. Confidence label (HIGH / MEDIUM / LOW) with "why" tooltip
  7. Disclaimer bar: "Explains your SIP figures. Not investment advice."
  8. Feedback: "Was this clear?" (yes/no) · "Did this feel like advice?" (yes/no)
  │
  ▼
Back to SIP OVERVIEW (nothing pushed, no follow-up prompt)
```

**Content blocks by situation (what the explanation covers, not final text)**

| Situation | Block 2 covers | Block 3 covers |
|---|---|---|
| Small negative, month 3–6 | What a small negative at this tenure can reflect (e.g., early SIP returns are close to the invested amount and move with the market); how it is calculated | That this does not predict this SIP's outcome and is not a reason to act either way |
| Flat | Why a flat figure is common early on | Same |
| Positive | What the figure shows | That a positive figure is not a promise |
| Month 1 / one instalment | Not enough history to interpret → F1 | n/a |
| Over 12 months | Longer-tenure reading of the same figures | Same |

(All statements must come from approved templates and verified sources; text above only describes intent.)

### 3.2 Alternative and edge flows

| ID | Flow | Behaviour |
|---|---|---|
| **F1** | **Not sure / insufficient data** | "I'm not sure about this" card, reason in one line (e.g., "Not enough instalments yet"), official-source link, help action, confidence LOW. No guess. |
| **F2** | **Advice request** (R2 free text; or a future "ask" box) | Deterministic pre-filter matches ("should I stop/continue/sell/buy/switch", "which fund", "will it recover", "what would you do") → fixed refusal card: what the tool can and cannot do + official source or adviser pointer. No model call. No leaning either way. |
| **F3** | **Term tap** | Bottom sheet: one vetted definition + source. XIRR sheet includes the short-period note. Close with button, swipe or Escape; focus returns to the chip. |
| **F4** | **XIRR unavailable** | "XIRR unavailable for this SIP yet" with reason; the Coach continues on absolute return; confidence MEDIUM if XIRR was needed for a block. |
| **F5** | **XIRR differs from provider's** | Show the account figure labelled "as shown in your account"; confidence MEDIUM; the "How we worked this out" panel lists both. |
| **F6** | **Positive or quiet SIP** | Coach available on request only; no prompt appears. |
| **F7** | **Quarterly or weekly SIP** | Tenure and instalment counts reflect the SIP's frequency; wording adapts ("2 quarterly instalments"). |
| **F8** | **LLM enabled, validation fails or times out** | User sees the template text; nothing indicates an error. |
| **F9** | **User turns the Coach off** | Entry points hidden for that user; can re-enable in settings. |
| **F10** | **Show the working** (P1) | "How we worked this out" panel: the figures used and rule applied. |

### 3.3 Decision logic (what the user never sees, shown for design clarity)
```
figures complete? ─ no ─▶ F1
tenure computed? ─ no ─▶ F1
situation matched? ─ no ─▶ F1
verified source for each general statement? ─ no ─▶ F1
confidence = f(rule)   ─▶ render template (and optionally rephrase → validate → else template)
```

### 3.4 Success and measurement (proposed; no baselines)
- **Task success:** the user can state what the figure means at their stage and that it is not advice (usability test).
- **Events:** `coach_opened(entry, situation, stage)`, `term_opened(term)`, `source_opened(id)`, `feedback(clear, felt_like_advice)`, `fallback_shown(reason)`, `refusal_shown`.
- **Guardrails:** "felt like advice" near zero; no increase in pause or cancel after exposure; no increase in support contact.

---

## 4. MODULE 2: DEBIT EXPLAINER

### 4.1 Primary flow

```
Entry: failed/missed instalment row on SIP OVERVIEW   OR   failure notice (same template)
  ▼
DEBIT EXPLAINER SCREEN
  Failure card
    ├─ Why it failed             (plain reason from the rules table)
    ├─ Is my SIP still active?   (status chip + one line; consistent everywhere)
    └─ What to do next           (ONE primary action; optional secondary)
  Retry info (only if supplied): "Next automatic retry: <date>"
  History (P1): recent failed/missed instalments with reason and outcome
  │
  ├─ primary action tapped ─▶ (e.g., Add balance & retry) ─▶ RETRY FLOW
  └─ back ─▶ SIP OVERVIEW
```

### 4.2 Status states shown to the user

| State | Chip | Meaning |
|---|---|---|
| `ACTIVE` | emerald, check icon | No problem |
| `MISSED_CONTINUES` | amber, alert icon | This instalment was missed; the SIP continues |
| `AT_RISK` | amber, alert icon | **Only if a verified consecutive-failure rule is configured and reached**; otherwise never shown |
| `PAUSED` | amber/blue, pause icon | User-paused |
| `CANCELLED` | coral, x icon | SIP is cancelled |

### 4.3 Retry flow (mock)
```
Primary action "Retry now" shown ONLY if manual_retry_allowed
  ▼ confirm sheet: amount, date, account type (no sensitive identifiers) ─▶ confirm
  ▼ result: success ─▶ status ACTIVE, history updated
            failure ─▶ new reason (explained again, same format)
            unavailable ─▶ F-D2
```

### 4.4 Alternative and edge flows

| ID | Flow | Behaviour |
|---|---|---|
| **F-D1** | **Unknown reason code** | Generic message ("We couldn't complete this debit"), status line, support action. No guessed reason. |
| **F-D2** | **Retry not supported or not allowed** | Retry button absent; show the primary action that is allowed (e.g., contact support) and the auto-retry date if supplied. |
| **F-D3** | **Mandate expired or inactive** | Primary action: renew or re-authorise mandate (deep link if available); status line reflects the effect on the next instalment. |
| **F-D4** | **UPI limit exceeded** | Reason plus action "Check your UPI limit and retry"; no bank-specific numbers. |
| **F-D5** | **Consequences** | Fees, penalties or cancellation rules appear **only** if a verified source backs the rule row; otherwise nothing is said about them (no false reassurance, no scare). |
| **F-D6** | **Multiple failures** | List shows each event; the status line reflects the verified rule if configured, else "continues". |
| **F-D7** | **Failure notice tapped from notification** | Lands on the same screen; the notice text equals the screen's reason, status and action. |
| **F-D8** | **Failure during a pause window** | Instalments in the pause window are "skipped", not "failed"; no failure screen. |

### 4.5 Success and measurement (proposed)
- **Task success:** the user can say why it failed, whether the SIP is active, and what to do (usability test).
- **Events:** `debit_explainer_opened(reason, status)`, `action_tapped(type)`, `retry_result(success|fail)`, `fallback_shown(reason)`.
- **Outcome proxy:** recovery within 7 days (target to be set after a baseline exists).
- **Guardrail:** no duplicate-debit incidents; no rise in support contacts.

---

## 5. MODULE 3: PAUSE AND RESTART

### 5.1 Pause flow

```
SIP OVERVIEW ─▶ Manage SIP ─▶ OPTIONS (three equal cards; none preselected)
   ┌───────────────┬───────────────────┬───────────────┐
   │ Pause         │ Reduce amount      │ Cancel         │   each with plain consequences
   └──────┬────────┴─────────┬─────────┴───────┬────────┘   (only verified facts)
          ▼                  ▼                 ▼
     PAUSE FORM         REDUCE FORM         CANCEL FLOW (confirm; no persuasion)
```

**Pause form**
```
1. Start:  [next debit date ▾]   (user can change)
2. Until:  ( ) pick an end date   ( ) until I resume
3. Reminder:  [ ] Remind me to decide about restarting     ← OFF by default
        if checked: when? [date/time]   how? [in-app | email | SMS | push]   exactly what will be sent (one line)
4. Review: "Your next debit is skipped. Your SIP will be PAUSED until <date> / until you resume."
           What stays the same / what changes (verified facts only)
5. [Confirm pause]   [Back]
  ▼
CONFIRMATION: status chip "PAUSED UNTIL <date>", next steps in plain language, [Undo]
  ▼
SIP OVERVIEW shows paused status everywhere (list, detail, notices)
```

### 5.2 During the pause
```
Paused SIP shows: status chip · "Paused until <date>" · [Resume now] [Change dates]
No banners, no countdowns, no "you are missing out", no streaks.
If a pause has an end date: at the end the SIP returns to ACTIVE as the user chose (the user was told at confirmation).
If "until I resume": the SIP stays paused until the user acts.
```

### 5.3 Opt-in reminder flow
```
User opted in? ─ no ─▶ nothing is ever sent
      │ yes
      ▼
At the chosen time (once only) ─▶ REMINDER (in-app inbox in the prototype)
   "Your SIP is paused until <date>." (one factual sentence)
   [ Resume ]   [ Extend ]   [ Leave paused ]      ← three equal actions
      │            │              │
      ▼            ▼              ▼
   RESUME       EXTEND FORM    Dismiss (no follow-up, no second message)
```
Rules: one reminder per pause; no escalation; no repeat if ignored; no guilt or loss wording.

### 5.4 Resume, extend, undo
```
Resume ─▶ confirm sheet: "Next debit: <date>, <amount>" ─▶ confirm ─▶ ACTIVE
Extend ─▶ pick new end date or "until I resume" ─▶ confirm ─▶ PAUSED (updated)
Undo   ─▶ available before the pause starts and immediately after (where supported) ─▶ ACTIVE
```

### 5.5 Alternative and edge flows

| ID | Flow | Behaviour |
|---|---|---|
| **F-P1** | **Pause with no end date** | Allowed; confirmation says clearly it stays paused until the user resumes; reminder still opt-in. |
| **F-P2** | **Platform cannot pause a mandate** | Options screen states what will happen instead (e.g., instalments skipped but mandate remains) from verified rules; if nothing verified, says so and offers support. |
| **F-P3** | **Reduce instead of pause** | Reduce form with current and new amount shown; never presented as the "better" choice. |
| **F-P4** | **Cancel** | Plain confirmation of what cancel does; one confirm; no retention pressure, no extra screens or discounts. |
| **F-P5** | **Illegal action** (e.g., resume an active SIP) | Plain message, no state change. |
| **F-P6** | **Debit date falls inside the window** | Marked skipped; shown in history as "skipped (paused)". |
| **F-P7** | **Reminder channel fails** | Retried quietly; falls back to in-app; never duplicates. |
| **F-P8** | **User opts out later** | Toggle off removes the pending reminder immediately. |
| **F-P9** | **Quarterly SIP** | Pause dates map to the SIP's schedule; the review step shows which instalment dates are skipped. |
| **F-P10** | **Cash-flow squeeze arrives via a failed debit** | From the Debit Explainer, an optional secondary link "See pause or reduce options"; never pushed. |

### 5.6 Success and measurement (proposed)
- **Task success:** the user can say what pause does, chooses their own dates, and knows how to resume.
- **Events:** `options_viewed`, `pause_created(has_end_date, reminder_opt_in)`, `reminder_sent`, `resume(source)`, `extend`, `undo`, `cancel`.
- **Outcome proxy:** reactivation within 60 days of a pause (baseline needed).
- **Guardrails:** complaints about reminders; opt-out rate; no rise in cancellations after exposure.

---

## 6. Journey walkthroughs (mock personas; illustrative, not research data)

| Persona (mock) | Starting situation | Flow | Expected end state |
|---|---|---|---|
| `early-flat` | 5 monthly instalments of ₹2,500 (₹12,500 invested), small negative | SIP Overview → "Is this normal?" → Coach → term sheet (XIRR) → feedback → back | User sees own figures, tenure 5 months, explanation, source, confidence, disclaimer; nothing pushed afterwards |
| `positive` | Same tenure, small positive | SIP Overview only | No prompt appears; Coach available on request |
| `new-month-1` | One instalment | → Coach | F1 Not-sure card (not enough history), official link |
| `debit-upi-limit` | Failed instalment, mapped reason | Notice → Debit Explainer → primary action → (mock retry) | Reason, status "missed, continues", action, retry date if supplied |
| `debit-unknown` | Unmapped reason | → Debit Explainer | F-D1 generic message, support action |
| `debit-mandate-expired` | Mandate inactive | → Debit Explainer | F-D3 renew action |
| `cashflow-pause` | Active SIP, income squeeze | Manage SIP → Options → Pause form (end date, reminder opt-in) → Confirm | PAUSED until date; one opt-in reminder; Resume/Extend/Leave paused available |
| `cashflow-pause` (no opt-in) | Same, reminder unchecked | … | No reminder ever sent |
| `missing-xirr` | No provider XIRR | → Coach | F4, absolute-return-based explanation |
| `quarterly` | Quarterly SIP | → Coach and Pause | F7, F-P9 wording adapts |

---

## 7. Content and tone guardrails for every screen

- **Allowed:** "Here is what your figures show", "This is common at this stage" *only if a verified source supports it*, "You can resume whenever you choose".
- **Not allowed:** "act now", "don't miss", "you should", "buy/sell/switch/stay invested" as an instruction, predictions ("will recover"), loss framing, countdowns, streaks, guilt ("you've paused for 90 days"), social proof.
- **Numbers:** only the user's own or from a cited source. Never estimated.
- **Colour:** coral only for a genuine failure or cancelled state; a flat/negative return is never coral.
- **Disclaimer:** present on every Coach surface without scrolling.
- Copy is linted in CI against the banned-phrase list.

## 8. Accessibility paths (every flow)
- Complete each flow by keyboard only; focus order follows reading order; focus returns to the trigger when a sheet closes.
- Status is text plus icon; amounts and dates are readable by screen readers.
- Targets at least 44 px; text scales to 200%; motion respects reduced-motion.
- Verified in both dark and light mode.

## 9. Open questions
1. Is a pause with an end date possible on the real platform? (Determines PR-2 and F-P1 wording.)
2. Which provider failure codes and retry data exist? (Determines the Debit Explainer rule rows and F-D2.)
3. Which reminder channels are available beyond in-app?
4. Should the Coach also appear from fund-level screens, or SIP-level only for R1?
5. Does the theme default follow the system preference or always start dark (as the engine does)?
6. Who owns content review and compliance sign-off for each screen's text?
