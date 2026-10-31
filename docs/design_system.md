# 💎 INDmoney Design System & UI Specification — AI Discovery Engine
**Source Document:** `INDmoney Design System & UI Specification.docx`  
**Application:** Stage 4 Next.js Interactive Discovery Engine Web Application  

---

## 1. Executive Summary & Design Principles

INDmoney’s visual language is engineered around **"High-Trust Financial Super-App"** aesthetics. Because the engine analyzes dense, complex user behavior, sentiment, and drop-off metrics across thousands of data points, its design system strictly adheres to five core tenets:

1. **Scannability over Decoration:** Dense analytical matrices are broken into modular, rounded-corner surface cards with strict typographic hierarchy.
2. **Dual-Surface Architecture (Dark Hero + High-Contrast Canvas):** A signature layout pattern featuring a deep navy/charcoal hero banner (`linear-gradient(135deg, #0F172A 0%, #1E293B 100%)`) that anchors top-level net numbers, transitioning into high-contrast dark surface cards (`#151A23` on `#0B0E14` canvas).
3. **Tabular Precision (`tabular-nums`):** All percentage changes, opportunity scores, signal counts, and metrics strictly apply `font-variant-numeric: tabular-nums` to guarantee pixel-perfect vertical alignment and eliminate horizontal jitter.
4. **Instant Semantic Feedback:** Color is strictly functional:
   - **Primary Blue (`#1A6BFF`):** Drives primary actions, navigation, active tab pills, and interactive links.
   - **Brand Emerald (`#00B386`):** Signals positive retention opportunities, bull metrics, high actionability, and verified data.
   - **Coral Red (`#EB5B3C`):** Strictly reserved for drop-off churn, portfolio loss anxiety, high severity friction, and negative sentiment.
   - **Amber Warning (`#F59E0B`):** Flags moderate friction, drop-off caution windows (e.g. Month 3–6), and alerts.
5. **Polished Micro-Interactions:** Subtle 1px hairline borders (`#262F40`), soft pill fills (`rgba(0, 179, 134, 0.15)`), and fluid segmented pill switches (`rounded-full`).

---

## 2. Color System & Design Tokens

### 2.1 Brand & Action Palette

| Token Name | Hex Code | RGB | Usage & Role |
|------------|----------|-----|--------------|
| `--ind-primary-blue` | `#1A6BFF` | `rgb(26, 107, 255)` | Primary CTA buttons, active tab indicators, interactive links |
| `--ind-primary-blue-hover` | `#0052CC` | `rgb(0, 82, 204)` | Hover / pressed state for primary blue interactive elements |
| `--ind-primary-blue-soft` | `#EBF3FF` | `rgb(235, 243, 255)` | Subtle badge fills, selected row backgrounds |
| `--ind-brand-emerald` | `#00B386` | `rgb(0, 179, 134)` | Secondary brand accent, opportunity badges, high retention impact |
| `--ind-brand-navy` | `#0F172A` | `rgb(15, 23, 42)` | Signature top hero banner background, institutional header surface |

### 2.2 Surface & Neutral Palette (Dark First)

| Token Name | Dark Mode Hex | Usage & Role |
|------------|---------------|--------------|
| `--ind-bg-canvas` | `#0B0E14` | Primary page canvas background behind cards |
| `--ind-bg-surface-1` | `#151A23` | Default card surface, list containers, navigation bars |
| `--ind-bg-surface-2` | `#1E2532` | Nested cards, input field backgrounds, table headers |
| `--ind-bg-elevated` | `#252D3D` | Modals, bottom sheets, dropdown menus, floating tooltips |
| `--ind-border-subtle` | `#262F40` | 1px card borders, hairline dividers (`1px solid #262F40`) |
| `--ind-border-focus` | `#3B82F6` | Active input rings, selected card outlines |

### 2.3 Semantic Financial Palette (Market & Churn Signals)

| Token Name | Foreground Hex | Subtle Dark Pill Fill | Usage & Role |
|------------|----------------|-----------------------|--------------|
| `--ind-semantic-bull` | `#00B386` | `rgba(0, 179, 134, 0.15)` | Positive P&L, high retention, verified signal badges |
| `--ind-semantic-bear` | `#EB5B3C` | `rgba(235, 91, 60, 0.15)` | Drop-off friction, churn rate, high severity alert |
| `--ind-semantic-warn` | `#F59E0B` | `rgba(245, 158, 11, 0.15)` | Moderate friction, Month 3–6 critical window, caution |
| `--ind-semantic-info` | `#3B82F6` | `rgba(59, 130, 246, 0.15)` | Citations, discovery question tags, segment badges |

---

## 3. Typography System & Numerical Rules

### 3.1 Font Stack & Mandatory Tabular Numerals
- **Primary UI Font Stack:** `'Inter', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Monospace Font Stack:** `'JetBrains Mono', 'Fira Code', monospace`
- **Mandatory CSS Rule for Financial Figures:** Always apply `font-variant-numeric: tabular-nums;` (Tailwind `tabular-nums`) to all counts, scores, percentages, and metrics.

### 3.2 Typographic Hierarchy Scale

| Style Token | Size | Line Height | Weight | Letter Spacing | Primary Application |
|-------------|------|-------------|--------|----------------|---------------------|
| **Display / NetWorth** | `2.25rem (36px)` | `2.75rem (44px)` | 700 (Bold) | `-0.02em` | Hero KPI total signals analyzed, live counters |
| **H1 / Page Title** | `1.5rem (24px)` | `2.0rem (32px)` | 700 (Bold) | `-0.015em` | Main dashboard section headers, page titles |
| **H2 / Section Header** | `1.125rem (18px)` | `1.625rem (26px)` | 600 (SemiBold) | `-0.01em` | Section headers ("Top Opportunity Themes") |
| **H3 / Card Title** | `1.0rem (16px)` | `1.5rem (24px)` | 600 (SemiBold) | `0em` | Individual card titles, theme names |
| **Body / Primary** | `0.875rem (14px)` | `1.25rem (20px)` | 400 / 500 | `0em` | Standard text, verbatim quotes, table cells |
| **Caption / Subtext** | `0.75rem (12px)` | `1.0rem (16px)` | 500 (Medium) | `+0.01em` | Metadata, date timestamps, chart labels |
| **Micro / Badge** | `0.6875rem (11px)` | `0.875rem (14px)` | 600 (SemiBold) | `+0.04em` | Uppercase category tags (`INDMONEY`, `MONTH 3-6`) |

---

## 4. Layout, Grid & Spatial Architecture

### 4.1 8-Point Spatial System
- `space-1 (4px)`: Icon-to-text inline gap, delta arrow spacing
- `space-2 (8px)`: Badge internal padding, tight vertical title-subtitle stacks
- `space-3 (12px)`: Compact list item vertical padding, grid gap on mobile
- `space-4 (16px)`: Standard mobile horizontal margin, default card internal padding
- `space-5 (20px)`: Desktop card internal padding
- `space-6 (24px)`: Section-to-section vertical spacing, desktop grid gutter
- `space-8 (32px)`: Major layout container separation

### 4.2 Responsive Grid
- **Max Container Width:** `1280px` (`max-w-[1280px]` or `max-w-7xl`) centered with `24px–32px` side padding.
- **Asymmetric 2-Column Split (Desktop):**
  - Left / Main column (`65%` or 8 cols in a 12-col grid): Net Worth Hero Card, Top Opportunity Themes, Interactive Trend Analytics.
  - Right Sticky Rail (`35%` or 4 cols): RAG Ask The Engine quick search, Source Distribution Donut, and Segment Filter controls.
- **Mobile App Viewport:** Single-column vertical flow with `16px` safe-area padding and horizontal scroll snap for quick filter chips.

### 4.3 Border Radius & Elevation Tokens
- `--radius-xs (6px)`: Percentage delta pills, micro tags (`+3.2%`, `PLAY STORE`)
- `--radius-sm (8px)`: Input fields, filter buttons
- `--radius-md (12px)`: Primary CTA buttons, nested summary boxes
- `--radius-lg (16px)`: Standard asset / theme cards, evidence panels
- `--radius-xl (24px)`: Net Worth Hero container, modal dialogs
- `--radius-full (9999px)`: Filter chips, segmented pill toggles, circular avatars
- `--shadow-card`: `0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)` (paired with 1px solid `#262F40`)
- `--shadow-float`: `0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`

---

## 5. Core Component Blueprints

### 5.1 The "Net Worth Hero" Metric Card (`NetWorthHero.tsx`)
- **Visuals:** Dark gradient background (`linear-gradient(135deg, #0F172A 0%, #1E293B 100%)`), 24px border radius (`rounded-ind-xl`), 1px solid hairline border (`#262F40`).
- **Header:** Label `TOTAL SIGNALS ANALYZED` (`11px`, uppercase, `#94A3B8`, `letter-spacing: 0.06em`) + Eye privacy mask toggle (`••••••`).
- **Primary Value:** `6,247` in `36px` bold tabular numerals (`text-white font-bold tracking-tight tabular-nums`).
- **Delta Pill:** Emerald badge (`+100% verified`) with `bg-ind-emerald/15 text-ind-emerald` and upward arrow icon.
- **Footer Metrics Strip:** Compact inline stats for Distinct Sources (`≥5`), Drop-off Critical Window (`Months 3–6`), and Golden Set Verified (`100%`).

### 5.2 Opportunity Theme Card (`ThemeCard.tsx`)
- **Structure:** 16px rounded surface (`bg-ind-surface-1 border border-ind-border-subtle hover:border-ind-primary-blue/40 transition`), with subtle hover lift (`shadow-ind-float`).
- **Header:** Theme Name (e.g., `T1 · Red Portfolio Panic`) + Rank pill (`#1 Opportunity Area`).
- **Score Visual:** Opportunity Score dial (`0.87 / 1.00`) displayed with tabular numbers.
- **Factor Breakdown Bar:** Visual multi-segment progress bar reflecting the 4 formula factors:
  - Frequency ($W_f = 0.30$)
  - Severity ($W_s = 0.30$)
  - Actionability ($W_a = 0.25$)
  - Recency ($W_r = 0.15$)
- **Micro Pills:** Segment badge (`First-timer`), Emotion badge (`Anxious`), and Lifecycle badge (`Month 3–6`).
- **Verbatim Callout:** Quote snippet with 2px left emerald or blue hairline border.

### 5.3 Segmented Filter Chips (`FilterChips.tsx`)
- Full-rounded pills (`rounded-full px-3.5 py-1.5 text-xs font-medium`).
- **Active State:** Solid Royal Blue (`bg-ind-primary-blue text-white shadow-sm`) or Brand Emerald (`bg-ind-emerald text-black font-semibold`).
- **Inactive State:** `bg-ind-surface-2 text-slate-400 hover:text-white hover:bg-ind-surface-elevated border border-ind-border-subtle`.

### 5.4 INDmoney AI Copilot Search Bar (`AskTheEngine.tsx`)
- Rounded-2xl container (`bg-ind-surface-1 border border-ind-border-subtle focus-within:border-ind-primary-blue focus-within:ring-2 focus-within:ring-ind-primary-blue/20`).
- AI Sparkle icon prefix in Royal Blue / Emerald gradient.
- Pre-loaded prompt chips below input: `[Red Portfolio Panic]`, `[Mandate vs Returns Drops]`, `[Month 3-6 Churn]`, `[First-timer Unmet Needs]`.
- Citation cards rendered in QuoteCard format with verified source pill.

### 5.5 Source Attribution Badges (`SourceBadge.tsx`)
- Micro-pill (`11px`, `rounded-xs`, `font-medium`):
  - **Google Play:** `bg-emerald-950/60 text-emerald-400 border border-emerald-800/60`
  - **Apple App Store:** `bg-blue-950/60 text-blue-400 border border-blue-800/60`
  - **Reddit:** `bg-orange-950/60 text-orange-400 border border-orange-800/60`
  - **YouTube:** `bg-red-950/60 text-red-400 border border-red-800/60`
  - **TradingQ&A:** `bg-indigo-950/60 text-indigo-400 border border-indigo-800/60`
