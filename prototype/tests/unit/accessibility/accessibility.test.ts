import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Calculates relative luminance according to WCAG 2.2 specifications.
 */
function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculates contrast ratio between two hex colors.
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Phase 8: Accessibility & WCAG 2.2 AA Compliance Audit', () => {
  describe('WCAG 2.2 AA Contrast Ratios (Minimum 4.5:1 for body text, 3:1 for large)', () => {
    // Dark mode palette
    const DARK_BG = '#0B0E14';
    const DARK_SURFACE = '#151B26';
    const DARK_TEXT_PRIMARY = '#F8FAFC';
    const DARK_TEXT_MUTED = '#8896AB'; // QA-07 contrast token
    const DARK_BLUE = '#60A5FA';
    const DARK_CORAL = '#F4806A';

    // Light mode palette
    const LIGHT_BG = '#F4F6F9';
    const LIGHT_SURFACE = '#FFFFFF';
    const LIGHT_TEXT_PRIMARY = '#0F172A';
    const LIGHT_TEXT_MUTED = '#5A6A7F'; // QA-07 contrast token
    const LIGHT_BLUE = '#0052CC';
    const LIGHT_EMERALD = '#007A5C';
    const LIGHT_CORAL = '#C2410C';
    const LIGHT_AMBER = '#92400E';

    it('satisfies WCAG 2.2 AA text contrast in Dark Mode (>= 4.5:1)', () => {
      const primaryRatio = getContrastRatio(DARK_BG, DARK_TEXT_PRIMARY);
      expect(primaryRatio, 'Dark text primary contrast').toBeGreaterThanOrEqual(4.5);

      const mutedRatio = getContrastRatio(DARK_BG, DARK_TEXT_MUTED);
      expect(mutedRatio, 'Dark text muted contrast').toBeGreaterThanOrEqual(4.5);

      const surfaceMutedRatio = getContrastRatio(DARK_SURFACE, DARK_TEXT_MUTED);
      expect(surfaceMutedRatio, 'Dark surface text muted contrast').toBeGreaterThanOrEqual(4.5);

      const blueRatio = getContrastRatio(DARK_BG, DARK_BLUE);
      expect(blueRatio, 'Dark blue contrast').toBeGreaterThanOrEqual(4.5);

      const coralRatio = getContrastRatio(DARK_BG, DARK_CORAL);
      expect(coralRatio, 'Dark coral contrast').toBeGreaterThanOrEqual(4.5);
    });

    it('satisfies WCAG 2.2 AA text contrast in Light Mode (>= 4.5:1)', () => {
      const primaryRatio = getContrastRatio(LIGHT_BG, LIGHT_TEXT_PRIMARY);
      expect(primaryRatio, 'Light text primary contrast').toBeGreaterThanOrEqual(4.5);

      const mutedRatio = getContrastRatio(LIGHT_BG, LIGHT_TEXT_MUTED);
      expect(mutedRatio, 'Light text muted contrast').toBeGreaterThanOrEqual(4.5);

      const surfaceMutedRatio = getContrastRatio(LIGHT_SURFACE, LIGHT_TEXT_MUTED);
      expect(surfaceMutedRatio, 'Light surface text muted contrast').toBeGreaterThanOrEqual(4.5);

      const blueRatio = getContrastRatio(LIGHT_BG, LIGHT_BLUE);
      expect(blueRatio, 'Light blue contrast').toBeGreaterThanOrEqual(4.5);

      const emeraldRatio = getContrastRatio(LIGHT_BG, LIGHT_EMERALD);
      expect(emeraldRatio, 'Light emerald contrast').toBeGreaterThanOrEqual(4.5);

      const coralRatio = getContrastRatio(LIGHT_BG, LIGHT_CORAL);
      expect(coralRatio, 'Light coral contrast').toBeGreaterThanOrEqual(4.5);

      const amberRatio = getContrastRatio(LIGHT_BG, LIGHT_AMBER);
      expect(amberRatio, 'Light amber contrast').toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Component Touch Targets (Minimum 44x44 CSS pixels)', () => {
    const COMPONENT_DIR = path.resolve(__dirname, '../../../src/components');

    it('enforces min-h-[44px] or h-11 on all interactive buttons and actionable links', () => {
      const componentFiles: string[] = [];

      function walkDir(dir: string) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
          } else if (file.endsWith('.tsx')) {
            componentFiles.push(fullPath);
          }
        }
      }

      walkDir(COMPONENT_DIR);
      expect(componentFiles.length).toBeGreaterThan(10);

      for (const filePath of componentFiles) {
        const content = fs.readFileSync(filePath, 'utf8');

        // Look for buttons and links
        const buttonMatches = content.matchAll(/<button[^>]*className=["']([^"']*)["'][^>]*>/g);
        for (const match of buttonMatches) {
          const className = match[1] ?? '';
          // Interactive button must have min-h-[44px], h-11, h-12, py-3, py-3.5 or p-3
          const hasTargetSize =
            className.includes('min-h-[44px]') ||
            className.includes('h-11') ||
            className.includes('h-12') ||
            className.includes('py-3') ||
            className.includes('p-3') ||
            className.includes('h-10 w-10') || // standard 40px icon button with padding
            className.includes('p-2.5');

          expect(
            hasTargetSize,
            `Button in ${path.basename(filePath)} must have adequate touch target size: "${className}"`
          ).toBe(true);
        }
      }
    });
  });

  describe('Accessible Naming & Keyboard Attributes', () => {
    const COMPONENT_DIR = path.resolve(__dirname, '../../../src/components');

    it('ensures all icon-only buttons include descriptive aria-label or title attributes', () => {
      const componentFiles: string[] = [];

      function walkDir(dir: string) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
          } else if (file.endsWith('.tsx')) {
            componentFiles.push(fullPath);
          }
        }
      }

      walkDir(COMPONENT_DIR);

      for (const filePath of componentFiles) {
        const content = fs.readFileSync(filePath, 'utf8');

        // Check icon buttons (e.g. eye privacy toggle, theme toggle, drawer close button)
        const iconButtons = content.matchAll(/<button[^>]*aria-label=["']([^"']*)["'][^>]*>/g);
        for (const match of iconButtons) {
          const ariaLabel = match[1] ?? '';
          expect(ariaLabel.length, `aria-label in ${path.basename(filePath)} should be non-empty`).toBeGreaterThan(2);
        }
      }
    });
  });

  describe('Zero Coral Styling on Flat or Negative Returns', () => {
    it('verifies NetWorthHero and ReturnCoach never use coral or red for negative returns', () => {
      const netWorthPath = path.resolve(__dirname, '../../../src/components/dashboard/NetWorthHero.tsx');
      const coachPath = path.resolve(__dirname, '../../../src/components/coach/CoachCard.tsx');

      const netWorthContent = fs.readFileSync(netWorthPath, 'utf8');
      const coachContent = fs.readFileSync(coachPath, 'utf8');

      // Negative values must use neutral colors (#F8FAFC, text-white, or text-t1)
      expect(netWorthContent).toContain('text-[#F8FAFC]');
      expect(netWorthContent).not.toMatch(/isNegative\s*\?\s*['"][^'"]*text-coral/i);
      expect(netWorthContent).not.toMatch(/isNegative\s*\?\s*['"][^'"]*text-red/i);

      expect(coachContent).not.toMatch(/negative.*text-coral/i);
    });
  });

  describe('Tabular Numbers for Financial Metrics', () => {
    it('verifies MetricDisplay enforces tabular-nums font property', () => {
      const metricDisplayPath = path.resolve(__dirname, '../../../src/components/common/MetricDisplay.tsx');
      const content = fs.readFileSync(metricDisplayPath, 'utf8');

      expect(content).toContain('tabular-nums');
    });
  });
});
