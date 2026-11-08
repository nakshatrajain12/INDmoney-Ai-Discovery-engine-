---
name: Financial Trust
colors:
  surface: '#0e141c'
  surface-dim: '#0e141c'
  surface-bright: '#343943'
  surface-container-lowest: '#090e17'
  surface-container-low: '#171c25'
  surface-container: '#1b2029'
  surface-container-high: '#252a34'
  surface-container-highest: '#30353f'
  on-surface: '#dee2ef'
  on-surface-variant: '#c2c6d8'
  inverse-surface: '#dee2ef'
  inverse-on-surface: '#2c313a'
  outline: '#8c90a1'
  outline-variant: '#424655'
  surface-tint: '#b3c5ff'
  primary: '#b3c5ff'
  on-primary: '#002b75'
  primary-container: '#1a6bff'
  on-primary-container: '#fffeff'
  inverse-primary: '#0055d5'
  secondary: '#50ddad'
  on-secondary: '#003828'
  secondary-container: '#01b386'
  on-secondary-container: '#003d2c'
  tertiary: '#bec6e0'
  on-tertiary: '#283044'
  tertiary-container: '#6d758c'
  on-tertiary-container: '#fffeff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dae1ff'
  primary-fixed-dim: '#b3c5ff'
  on-primary-fixed: '#001849'
  on-primary-fixed-variant: '#003fa4'
  secondary-fixed: '#71fac8'
  secondary-fixed-dim: '#50ddad'
  on-secondary-fixed: '#002116'
  on-secondary-fixed-variant: '#00513b'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#0e141c'
  on-background: '#dee2ef'
  surface-variant: '#30353f'
  canvas: '#0B0E14'
  surface-1: '#151A23'
  surface-2: '#1E2532'
  surface-elevated: '#252D3D'
  border-subtle: '#262F40'
  status-active: '#00B386'
  status-error: '#EB5B3C'
  status-warn: '#F59E0B'
  text-primary: '#F8FAFC'
  text-secondary: '#94A3B8'
  text-muted: '#64748B'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-micro:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

# Design System: SIP Steady Prototype

**Source of truth:** INDmoney Design System & UI Specification (SIP Steady Prototype).
**Modes:** Dark (default) and Light, high-trust financial super-app aesthetic.

## Colors
- `--ind-canvas`: #0B0E14 (dark default), #F4F6F9 (light)
- `--ind-surface-1`: #151A23 (dark), #FFFFFF (light)
- `--ind-surface-2`: #1E2532 (dark), #F8FAFC (light)
- `--ind-surface-elevated`: #252D3D (dark), #FFFFFF (light)
- `--ind-border`: #262F40 (dark), #E2E8F0 (light)
- `--ind-blue`: #1A6BFF (actions, tabs, primary CTA)
- `--ind-emerald`: #00B386 (SIP active, verified source, high confidence)
- `--ind-coral`: #EB5B3C (failed debit, cancelled, genuine error)
- `--ind-warn`: #F59E0B (amber: needs attention, paused, medium confidence)
- `--ind-navy`: #0F172A (hero gradient `linear-gradient(135deg, #0F172A 0%, #1E293B 100%)`)
- `--ind-text-primary`: #F8FAFC (dark), #0F172A (light)
- `--ind-text-secondary`: #94A3B8 (dark), #475569 (light)
- `--ind-text-muted`: #64748B (dark & light)

## Typography
- Font Family: `Inter`, `Plus Jakarta Sans`, system-ui, -apple-system, sans-serif
- Monospace / Numeric: `font-variant-numeric: tabular-nums` for all rupees, percentages, XIRR, dates
- Hierarchy: Display (36px/700), H1 (24px/700), H2 (18px/600), H3 (16px/600), Body (14px/400-500), Caption (12px/500), Micro/Badge (11px/600 uppercase)

## Components
- Dual-surface architecture with signature navy hero card
- Pill status chips (icon + text)
- Confidence labels (`HIGH`, `MEDIUM`, `LOW`)
- Quote-style vetted citation callout
- Persistent disclaimer bar: "Explains your SIP figures. Not investment advice."
- Neutral treatment for flat/negative returns (never alarming red/coral)
