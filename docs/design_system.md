# 💎 INDmoney Design System — AI Discovery Engine UI Specification

This document defines the exact visual and interaction design system for the **AI Discovery Engine** web application, adhering strictly to **INDmoney’s signature Fintech SuperApp design language**.

---

## 1. Brand Aesthetics & Visual Principles

INDmoney’s signature design language is recognized for:
1. **Dark Mode First ("Pro Wealth" aesthetic):** Deep obsidian/slate-navy surfaces (`#080B11`, `#0F1622`) that convey premium wealth management, security, and high data density without visual clutter.
2. **INDmoney Mint Green (`#00D09C`):** The iconic primary accent color symbolizing wealth creation, positive compounding, and financial vitality.
3. **Glassmorphism & Crisp Depth:** Subtle 1px borders with low-opacity white glow (`border-white/[0.08]`), backdrop blurs, and layered card surfaces.
4. **Financial Data Density:** Monospaced, tabular numbers for percentages and metrics, accompanied by clean status badges and micro-pills (`+12.4%`, `-3.8%`, `High Severity`).
5. **Polished Micro-Interactions:** Subtle glowing hover states, fluid tab pill switches, and clean modal drill-downs.

---

## 2. Design Tokens & Color Palette

### 2.1 Color Tokens

```css
/* Core Canvas & Backgrounds */
--bg-canvas:        #080B11; /* Deepest background */
--bg-surface-1:     #0F1622; /* Primary container / Card surface */
--bg-surface-2:     #162032; /* Secondary card / Elevated card */
--bg-surface-3:     #1E2C42; /* Hover state & active elements */

/* Brand & Accents */
--ind-mint:         #00D09C; /* Signature INDmoney Green */
--ind-mint-hover:   #00B789;
--ind-mint-subtle:  rgba(0, 208, 156, 0.12); /* Background for green badges */

--ind-blue:         #2B6CB0; /* Deep secondary fintech blue */
--ind-cyan:         #00C9E8; /* Secondary metric accent */
--ind-purple:       #7C3AED; /* AI / Machine Intelligence accent */

/* Semantic Status */
--ind-red:          #F43F5E; /* Red portfolio / High friction / Loss */
--ind-red-subtle:   rgba(244, 63, 94, 0.12);
--ind-amber:        #F59E0B; /* Caution / Moderate friction */
--ind-amber-subtle: rgba(245, 158, 11, 0.12);

/* Typography & Text */
--text-primary:     #F8FAFC; /* 95% opacity white */
--text-secondary:   #94A3B8; /* Slate 400 */
--text-muted:       #64748B; /* Slate 500 */
--border-subtle:    rgba(255, 255, 255, 0.08);
--border-highlight: rgba(0, 208, 156, 0.35);
```

### 2.2 Typography System

* **Primary Font:** Inter / Plus Jakarta Sans (Clean, geometric modern sans-serif)
* **Numeric Font:** Inter / JetBrains Mono (with `font-feature-settings: 'tnum'` enabled for tabular alignment of scores, percentages, and currencies)

| Style | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| **Display 1** | 32px / 2rem | Bold (700) | 1.2 | Hero metrics, Top-level Page Headers |
| **Heading 2** | 22px / 1.375rem | Semi-Bold (600) | 1.3 | Card Titles, Section Headers |
| **Heading 3** | 16px / 1rem | Semi-Bold (600) | 1.4 | Module Titles, Filter Headers |
| **Body Regular** | 14px / 0.875rem | Regular (400) | 1.5 | Paragraphs, Quotes, Summaries |
| **Body SemiBold** | 14px / 0.875rem | Medium (500) | 1.5 | Table data, List titles |
| **Caption / Pill** | 12px / 0.75rem | Medium / SemiBold | 1.4 | Badges, Tags, Source labels |
| **Monospace Stat** | 14px / 0.875rem | Semi-Bold (600) | 1.0 | Scores, Percentages, Counters |

---

## 3. Tailwind Configuration (`tailwind.config.ts`)

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ind: {
          canvas: "#080B11",
          surface: {
            DEFAULT: "#0F1622",
            elevated: "#162032",
            hover: "#1E2C42",
          },
          mint: {
            DEFAULT: "#00D09C",
            hover: "#00B789",
            subtle: "rgba(0, 208, 156, 0.12)",
          },
          cyan: "#00C9E8",
          purple: "#7C3AED",
          red: {
            DEFAULT: "#F43F5E",
            subtle: "rgba(244, 63, 94, 0.12)",
          },
          amber: {
            DEFAULT: "#F59E0B",
            subtle: "rgba(245, 158, 11, 0.12)",
          },
          border: "rgba(255, 255, 255, 0.08)",
          borderGlow: "rgba(0, 208, 156, 0.3)",
        },
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
        "3xl": "24px",
      },
      boxShadow: {
        indGlow: "0 0 25px -5px rgba(0, 208, 156, 0.15)",
        cardGlow: "0 8px 30px rgba(0, 0, 0, 0.4)",
      },
    },
  },
  plugins: [],
};
export default config;
```

---

## 4. Component Library Specifications

### 4.1 Global Navigation Header (`Navbar.tsx`)
* **Background:** Glassmorphic bar (`bg-ind-surface/80 backdrop-blur-md border-b border-ind-border sticky top-0 z-50`)
* **Logo:** INDmoney logo glyph + pill badge reading `AI DISCOVERY ENGINE` in `text-ind-mint bg-ind-mint-subtle font-mono text-xs px-2 py-0.5 rounded-full`.
* **Tab Navigation:** Styled as INDmoney's floating segmented toggle:
  * Active Tab: `bg-ind-mint text-black font-semibold shadow-sm`
  * Inactive Tab: `text-slate-400 hover:text-white hover:bg-ind-surface-elevated`
* **Real-time Status Pill:** `"5,842 signals analyzed"` with a pulsing green indicator.

### 4.2 Hero KPI Widget (`OverviewStats.tsx`)
Inspired by INDmoney’s Net Worth & Investment Overview tracker:
* **Metric Cards:**
  * **Total Signals Analyzed:** `5,842` (`+100% verified`)
  * **Top Drop-off Window:** `Months 3–6` (highlighted in Amber)
  * **Primary Drop-off Cause:** `Red Portfolio Panic` (Frequency 33.8%)
  * **Opportunity Score Benchmark:** `0.87 / 1.00` (High Priority)
* **Card Style:** Dark surface with subtle gradient hairline borders, rounded-2xl, with tabular figures.

### 4.3 Theme Cards & Opportunity Matrix (`ThemeCard.tsx`)
* **Header:** Theme Name (e.g. `T1 · Red Portfolio Panic`) + Rank badge (`#1 Opportunity`)
* **Score Dial / Progress:** Visual bar for Opportunity Score filled with INDmoney Mint gradient.
* **Component Breakdown Bar:**
  * Frequency (30%) · Severity (30%) · Actionability (25%) · Recency (15%)
* **Micro-Pills:**
  * Segment: `First-time SIP` `Early Career`
  * Primary Emotion: `Anxious (High)`
  * Target Moment: `Month 3–6`
* **Verbatim Callout:** INDmoney styled quote box with left mint-accented border.

### 4.4 INDmoney AI Copilot / Search Bar (`AskTheEngine.tsx`)
* **Input Box:** Large rounded-2xl search container (`bg-ind-surface border border-ind-border focus-within:border-ind-mint shadow-indGlow`)
* **Prefix:** Sparkle AI icon with purple/mint gradient.
* **Placeholder:** `"Ask anything, e.g. Why do users pause SIPs in months 3-6 when portfolio turns red?"`
* **Pre-loaded Quick Pills (Prompt Chips):**
  * `[Red Portfolio Panic]`
  * `[Mandate vs Returns Drops]`
  * `[Social Media Influenced vs Self Research]`
  * `[Unmet Needs in Month 1-3]`
* **Citation Card Style:** Expandable accordion with verified badge `[Source: Play Store Review #1042]`, exact date, and star rating.

### 4.5 Source Attribution Badges (`SourceBadge.tsx`)
Colored micro-badges to give instant provenance:
* **Google Play:** Green icon / badge
* **App Store:** Silver / Blue badge
* **Reddit:** Orange / Charcoal badge (`r/mutualfunds`)
* **YouTube:** Crimson / Dark badge
* **TradingQ&A:** Indigo badge

---

## 5. Page Layout Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│  INDmoney [AI Discovery Engine]     Overview  Themes  Ask  Segments    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [Hero Stats Banner: 5,842 Public Signals · 6 Sources · 9 Discovery Qs]│
│                                                                        │
│  ┌───────────────────────────────┐  ┌────────────────────────────────┐ │
│  │  Top Opportunity Themes       │  │  Source Distribution & Sentiment│
│  │  #1 Red Portfolio Panic (0.87)│  │  [Donut Chart: Play Store 58%  │ │
│  │  #2 Expectation Gap     (0.81)│  │   Reddit 18%, YouTube 14%...]  │ │
│  │  #3 Mandate Friction    (0.79)│  │                                │ │
│  └───────────────────────────────┘  └────────────────────────────────┘ │
│                                                                        │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  ✨ Ask Discovery Engine (RAG Search with Verbatim Citations)      │ │
│  │  [ "Why do users stop their SIP after 3 months?"               🔍]│ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Implementation Checklist for Developers

1. [x] Color scheme configured in `tailwind.config.ts` matching INDmoney palette (`#00D09C` mint, dark navy canvas).
2. [x] Clean dark-mode by default (no blinding light themes; professional financial look).
3. [x] Inter font with tabular numerals for all metrics.
4. [x] Card borders styled with `border-white/[0.08]` and subtle hover glow (`shadow-indGlow`).
5. [x] Badges and chips using translucent backgrounds (`bg-ind-mint/10 text-ind-mint`).
6. [x] Responsive layout optimized for desktop mentor reviews and mobile viewing.

