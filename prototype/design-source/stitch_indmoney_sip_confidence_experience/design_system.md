# Design System: SIP Steady Prototype

**Source of truth:** the AI Discovery Engine's design system (`docs/design_system.md`, `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`, `app/components/*`), itself derived from `INDmoney Design System & UI Specification.docx`. The prototype follows the same philosophy, tokens, typography and theme mechanism so the two products read as one family.

**Modes:** dark and light, both first-class. Dark is the default, exactly as in the engine.

Contrast ratios below were computed (WCAG 2.x relative luminance) on 2026-11-08.

---

## 1. Design philosophy (inherited, adapted for the prototype)

The engine's "High-Trust Financial Super-App" principles carry over. The prototype adds a **calm, no-pressure** layer because its job is to reassure without advising.

| # | Principle | In the prototype |
|---|---|---|
| 1 | **Scannability over decoration** | Rounded surface cards, strict type hierarchy, one idea per card. |
| 2 | **Dual-surface architecture** | Deep navy hero card anchors the user's own SIP figures; high-contrast cards on the canvas below. |
| 3 | **Tabular precision** | Every ₹ amount, %, XIRR, count and date uses `tabular-nums`. |
| 4 | **Functional colour** | Colour carries meaning only (see §3.4). |
| 5 | **Polished micro-interactions** | 1px hairline borders, soft pill fills, `rounded-full` chips and toggles, 200 ms theme transition. |
| 6 | **Calm by default (new)** | No urgency, loss framing, countdowns, streaks or alarming red for a flat or negative return. Status is stated, not shouted. |
| 7 | **Honest uncertainty (new)** | Source and confidence label on every explanation; "Not sure" is a designed state, not an error. |
| 8 | **Not advice, visibly (new)** | A persistent "Not investment advice" label on Coach surfaces. |

---

## 2. Theming mechanism (same as the engine)

- Tailwind `darkMode: ["class"]`; the `dark` class on `<html>`; **default dark** (`<html className="dark">`).
- User choice persisted in `localStorage` under the key **`ind_theme`** (`"light"` or `"dark"`), applied by a small inline script before paint to avoid a flash, with `suppressHydrationWarning` on `<html>`.
- A toggle button in the header (sun/moon), keyboard-operable, with an accessible name ("Switch to light mode" / "Switch to dark mode").
- Respect the system preference only when no saved choice exists. (The engine always starts dark; the prototype may follow `prefers-color-scheme` first, a deliberate small extension. Confirm with the owner.)
- Every colour is a CSS variable; no component hard-codes a theme colour.
- `color-scheme: light` / `dark` set per mode so native controls match.
- Transition: `background-color 0.2s ease, color 0.2s ease`.

---

## 3. Colour system

### 3.1 Surface and text tokens (identical to `globals.css`)

| Token | Light | Dark | Role |
|---|---|---|---|
| `--ind-canvas` | `#F4F6F9` | `#0B0E14` | Page background |
| `--ind-surface-1` | `#FFFFFF` | `#151A23` | Cards, navigation, list containers |
| `--ind-surface-2` | `#F8FAFC` | `#1E2532` | Nested cards, inputs, table headers |
| `--ind-surface-elevated` | `#FFFFFF` | `#252D3D` | Modals, bottom sheets, menus, tooltips |
| `--ind-border` / `--ind-border-subtle` | `#E2E8F0` | `#262F40` | 1px hairlines |
| `--ind-border-focus` | `#3B82F6` | `#3B82F6` | Focus rings, selected outlines |
| `--ind-text-primary` | `#0F172A` | `#F8FAFC` | Headings, key figures |
| `--ind-text-secondary` | `#475569` | `#94A3B8` | Body support text |
| `--ind-text-muted` | `#64748B` | `#64748B` | Metadata only |

### 3.2 Brand and semantic tokens (from `tailwind.config.ts`)

| Token | Value | Soft fill (light) | Subtle fill (dark) |
|---|---|---|---|
| `--ind-blue` | `#1A6BFF` (hover `#0052CC`) | `#EBF3FF` | `rgba(59,130,246,0.15)` |
| `--ind-emerald` | `#00B386` | `#E6F8F3` | `rgba(0,179,134,0.15)` |
| `--ind-coral` | `#EB5B3C` | `#FDEDEA` | `rgba(235,91,60,0.15)` |
| `--ind-warn` | `#F59E0B` | `#FEF3C7` | `rgba(245,158,11,0.15)` |
| `--ind-navy` | `#0F172A` (light `#1E293B`) | n/a | Hero gradient `linear-gradient(135deg, #0F172A 0%, #1E293B 100%)` |
| `--ind-info` | `#3B82F6` | `#EBF3FF` | `rgba(59,130,246,0.15)` |

### 3.3 Contrast audit and the light-mode text variants (required)

| Pair | Ratio | Result |
|---|---|---|
| Primary text on surface-1, dark / light | 16.67 / 17.85 | Pass |
| Secondary text, dark / light | 6.80 / 7.58 | Pass |
| **Muted text**, dark on surface-1 / canvas | **3.67 / 4.06** | **Fails AA for body text** |
| Muted text, light on white / canvas | 4.76 / 4.40 | Pass on white, marginal on canvas |
| White on blue button `#1A6BFF` | 4.57 | Pass |
| Blue text `#1A6BFF` on dark surface | 3.81 | Large text only |
| Info blue `#3B82F6` on dark surface | 4.74 | Pass |
| Emerald `#00B386` on dark / **on white** | 6.47 / **2.69** | Light mode text **fails** |
| Coral `#EB5B3C` on dark / **on white** | 5.06 / **3.45** | Light mode text **fails** |
| Amber `#F59E0B` on dark / **on white** | 8.12 / **2.15** | Light mode text **fails** |

**Rules that follow**
1. **Muted text is metadata only** (timestamps, captions of 12 px and up that are not essential). Anything the user must read uses `--ind-text-secondary`, in both modes.
2. **In light mode, never use the bright brand colours as text.** Use these AA-passing text tokens (computed on white):

| Role | Light-mode text token | Ratio on white |
|---|---|---|
| Blue (links, active) | `#0052CC` (hover colour) | 6.82 |
| Emerald | `#007A5C` | 5.33 |
| Coral | `#C2410C` | 5.18 |
| Amber | `#92400E` | 7.09 |

   Bright brand colours remain valid for fills, icons, bars and borders (non-text, where the 3:1 rule applies).
3. Status is never colour-only; always add an icon and a text label.
4. Blue text on dark surfaces uses `#3B82F6`, not `#1A6BFF`, for body-size links.

### 3.4 Semantic colour rules for this prototype
The engine reserves coral for churn, loss anxiety and high severity. In a product that must not frighten users, the prototype applies the following **stricter** rules:

| Colour | Use | Do **not** use for |
|---|---|---|
| **Blue** | Primary actions, links, selected states, citations, "info" notes | Warnings |
| **Emerald** | Verified source, "SIP active", successful retry, High confidence | Implying a good return |
| **Amber** | "Needs attention" states: a missed instalment, Medium confidence, paused-until-date | Urgency or countdowns |
| **Coral** | Genuine failure states only: a failed debit, a cancelled SIP, an error | **A flat or negative return.** That is shown in neutral text with a neutral or info chip, never in alarm colour |
| **Neutral grey/slate** | Flat and negative returns, Low-confidence fallbacks, disclaimers | n/a |

A negative return is shown with a minus sign and plain text colour, not red, so the interface does not amplify anxiety (research: P01, P05 describe anxiety at a red figure).

---

## 4. Typography (same as the engine)

- **UI:** `Inter`, `Plus Jakarta Sans`, system-ui, `-apple-system`, sans-serif. **Mono:** `JetBrains Mono`.
- **Mandatory:** `font-variant-numeric: tabular-nums` on all figures (`.tabular-nums`, `[data-numeric]`, `.metric-value`).

| Token | Size / line | Weight | Spacing | Use in the prototype |
|---|---|---|---|---|
| Display | 36 / 44 | 700 | -0.02em | Hero: current value or return |
| H1 | 24 / 32 | 700 | -0.015em | Screen title |
| H2 | 18 / 26 | 600 | -0.01em | Section header ("What this means") |
| H3 | 16 / 24 | 600 | 0 | Card title |
| Body | 14 / 20 | 400 / 500 | 0 | Explanations, table cells |
| Caption | 12 / 16 | 500 | +0.01em | Source line, dates |
| Micro / badge | 11 / 14 | 600 | +0.04em | Confidence label, status chip (uppercase) |

Reading-level rule: plain English, short sentences. Body text on mobile is never below 14 px; no text below 11 px.

---

## 5. Layout, spacing, shape

- **8-point scale:** 4, 8, 12, 16 (mobile margin and card padding), 20 (desktop card padding), 24 (section gap and gutter), 32.
- **Container:** max 1280 px, centred, 24–32 px side padding on desktop.
- **Mobile first.** The prototype is designed as a mobile app view (single column, 16 px safe-area padding) and scales to the desktop two-column layout: main column about 65% (hero, Coach explanation), right rail about 35% (terms, sources, disclaimer).
- **Radius:** xs 6 (pills), sm 8 (inputs), md 12 (buttons), lg 16 (cards), xl 24 (hero, dialogs), full (chips and toggles).
- **Elevation:** cards use a 1px hairline plus `--shadow-card`; hover and floating elements use `--shadow-float`; glow shadows are reserved for the primary call to action only and are optional.
- **Touch targets:** at least 44 × 44 px.

---

## 6. Components

Inherited from the engine (same structure and tokens): **Navbar with theme toggle**, **NetWorthHero** (hero card), **FilterChips** (segmented chips), **QuoteCard / citation card**, **SourceBadge**, **OpportunityScoreBar**. New components for the three modules follow.

### 6.1 Shared

| Component | Spec |
|---|---|
| **App header** | Frosted surface (`rgba(255,255,255,0.92)` light; `surface-1` dark), 1px bottom hairline, product name, theme toggle. |
| **Hero card: "Your SIP"** | Navy gradient in both modes (the one surface that does not change), 24 px radius. Label `YOUR SIP` (11 px uppercase, secondary), invested and current value, return and XIRR in tabular numerals, tenure chip ("Month 5 · 5 instalments"). Privacy-mask toggle to hide amounts. |
| **Status chip** | Pill with icon and text: `ACTIVE` (emerald), `INSTALMENT MISSED · SIP CONTINUES` (amber), `PAUSED UNTIL 12 DEC` (amber/blue), `CANCELLED` (coral). Always icon plus text. |
| **Confidence label** | Micro badge: `HIGH` (emerald), `MEDIUM` (amber), `LOW` (neutral). Tooltip explains the rule. |
| **Source row** | Info-blue pill: source name, short title, date; opens the source. At least one per explanation. |
| **Disclaimer bar** | Neutral surface-2 strip: "Explains your SIP figures. Not investment advice." Always visible without scrolling on Coach screens. |
| **Not-sure card** | Neutral card, info icon, "I'm not sure about this", official link, help action. No error colouring. |
| **Primary button** | Blue fill `#1A6BFF`, white text, 12 px radius, 44 px height; hover `#0052CC`. Secondary: surface-2 with hairline border. |
| **Focus ring** | 2px `#3B82F6` ring with 2 px offset on every interactive element, both modes. |

### 6.2 Module 1: Return Coach
- **Explanation card** (surface-1, 16 px radius), three labelled blocks in order: **Your figures → What this means at month N → What it does not mean.**
- **Return display:** the figure is shown with its sign in primary text colour; flat and negative are never coral.
- **Term chips:** tappable (`XIRR`, `Absolute return`, `NAV`) open an elevated bottom sheet with the vetted definition and a source.
- **Quote-style callout** reused from QuoteCard (2px left hairline in info blue) for the "typical pattern" statement, only if a vetted dated source exists.
- **Advice refusal card:** neutral surface, scales icon, fixed text, links to an official source.
- **Feedback row:** "Was this clear?" and "Did this feel like advice?" as two small segmented toggles.

### 6.3 Module 2: Debit Explainer
- **Failure card:** coral icon accent (a genuine failure), plain-text reason, then three stacked rows: **Why it failed · Is my SIP still active? · What to do next.**
- **Status row** uses the Status chip; **next action** is the single primary button; a secondary link when allowed.
- **Retry info:** "Next automatic retry: 12 Dec" in tabular numerals, only if the provider supplies it.
- **Timeline list** (history): date, amount, reason, outcome; status chips per row.

### 6.4 Module 3: Pause and Restart
- **Options comparison:** three equal cards (**Pause · Reduce · Cancel**), none preselected, none highlighted as better, each with plain consequences.
- **Date picker:** pause start and end, native-accessible, with clear "until I resume" option.
- **Opt-in reminder toggle:** off by default, with a one-line description of exactly what will be sent, when, and how.
- **Confirmation card:** emerald check, plain next-step text, an **Undo** link.
- **Reminder message layout:** title, one factual sentence, three equal actions (Resume · Extend · Leave paused). No countdowns, streaks, guilt or loss wording.

---

## 7. Content and tone (design-level rules)

- Calm, factual, second person, short sentences.
- Banned: urgency ("act now", "don't miss"), loss framing, countdowns, streaks, social proof, guilt, FOMO, and instruction words ("you should", "buy", "sell", "switch", "stay invested" as an instruction).
- Numbers are always the user's own or come from a cited source. Never estimate a figure.
- Every explanation shows source plus confidence; every Coach surface shows the disclaimer.
- Copy is linted in CI against the banned-phrase list (see `product-requirements.md` FS-8).

---

## 8. Accessibility

- WCAG 2.2 AA target in **both** modes (§3.3 lists the exceptions already designed around).
- Visible focus ring; full keyboard operation; logical focus order; focus returned to the trigger when a sheet closes.
- Screen-reader names for the theme toggle, status chips (text, not just colour), amounts (use "rupees" and spoken dates) and charts.
- Minimum 44 px targets; respect `prefers-reduced-motion` (disable transitions beyond opacity); text scales to 200% without loss.
- Colour is never the only carrier of meaning; icons and labels accompany every status.

---

## 9. Implementation notes

1. Reuse the engine's `tailwind.config.ts` colour and radius tokens unchanged (`ind.*`, `ind-xs…xl`, shadows), and extend with the light-mode text tokens in §3.3.
2. Copy the engine's `:root` / `html.dark` variable block from `app/globals.css`; add the new text variants as `--ind-text-blue`, `--ind-text-emerald`, `--ind-text-coral`, `--ind-text-amber` (light values from §3.3; dark values equal the brand colours).
3. Replace the engine's `!important` light-mode overrides for header and footer with variable-driven styles.
4. Keep the dark-mode table safeguards (no white highlights on dark surfaces).
5. Build components against variables only, then verify every screen in both modes at 360, 768 and 1280 px.
6. Store assets in `prototype/assets/` and screens in `prototype/screens/`, one dark and one light capture per screen, named `<screen>-dark.png` / `<screen>-light.png`.

## 10. Verification checklist (before any screen is signed off)

- [ ] Screen reviewed in dark **and** light mode
- [ ] No bright brand colour used as light-mode body text
- [ ] No coral on a flat or negative return
- [ ] All figures use tabular numerals
- [ ] Source, confidence label and disclaimer visible on Coach screens
- [ ] Status shown with icon plus text
- [ ] Contrast checked for every new colour pair
- [ ] Focus ring, keyboard path and touch targets checked
- [ ] Copy passes the banned-phrase linter
