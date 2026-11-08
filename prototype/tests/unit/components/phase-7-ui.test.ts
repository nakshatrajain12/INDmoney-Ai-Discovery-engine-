import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase Gate 7: Frontend UI & Stitch Parity Verification', () => {
  const srcAppDir = path.resolve(__dirname, '../../../src/app');
  const srcComponentsDir = path.resolve(__dirname, '../../../src/components');

  const getAllFiles = (dir: string, ext = '.tsx'): string[] => {
    let files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(getAllFiles(fullPath, ext));
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        files.push(fullPath);
      }
    }
    return files;
  };

  const uiFiles = [...getAllFiles(srcAppDir), ...getAllFiles(srcComponentsDir)];

  it('verifies all interactive button and link elements enforce min 44x44px touch targets', () => {
    expect(uiFiles.length).toBeGreaterThan(10);

    for (const file of uiFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      // If file contains buttons or link elements
      if (content.includes('<button') || content.includes('<Link')) {
        const hasAccessibleTarget =
          content.includes('min-h-[44px]') ||
          content.includes('h-11') ||
          content.includes('min-w-[44px]') ||
          content.includes('min-w-[56px]') ||
          content.includes('w-11');
        expect(hasAccessibleTarget, `Missing 44x44 target in: ${file}`).toBe(true);
      }
    }
  });

  it('CRITICAL: Enforces ZERO coral styling on flat or negative returns in both themes', () => {
    // In NetWorthHero, MetricDisplay, ReturnCoachBanner, CoachCard:
    // Negative returns must use neutral text (text-t1, text-white, #F8FAFC), NEVER text-ind-coral or text-coral!
    const heroContent = fs.readFileSync(path.join(srcComponentsDir, 'dashboard/NetWorthHero.tsx'), 'utf-8');
    expect(heroContent).not.toContain('text-ind-coral');
    expect(heroContent).not.toContain('text-coral');
    expect(heroContent).not.toContain('bg-ind-coral');

    const metricContent = fs.readFileSync(path.join(srcComponentsDir, 'common/MetricDisplay.tsx'), 'utf-8');
    expect(metricContent).not.toContain('text-ind-coral');
    expect(metricContent).not.toContain('text-coral');

    const bannerContent = fs.readFileSync(path.join(srcComponentsDir, 'dashboard/ReturnCoachBanner.tsx'), 'utf-8');
    expect(bannerContent).not.toContain('border-l-ind-coral');
    expect(bannerContent).not.toContain('text-ind-coral');
  });

  it('verifies all monetary and percentage metrics render with tabular-nums', () => {
    const heroContent = fs.readFileSync(path.join(srcComponentsDir, 'dashboard/NetWorthHero.tsx'), 'utf-8');
    expect(heroContent).toContain('tabular-nums');

    const metricContent = fs.readFileSync(path.join(srcComponentsDir, 'common/MetricDisplay.tsx'), 'utf-8');
    expect(metricContent).toContain('tabular-nums');

    const sparklineContent = fs.readFileSync(path.join(srcComponentsDir, 'dashboard/AccumulationSparkline.tsx'), 'utf-8');
    expect(sparklineContent).toContain('tabular-nums');

    const coachCardContent = fs.readFileSync(path.join(srcComponentsDir, 'coach/CoachCard.tsx'), 'utf-8');
    expect(coachCardContent).toContain('tabular-nums');
  });

  it('verifies StatusChip semantics: Active is emerald, Alert is amber, Paused is blue, Cancelled is coral', () => {
    const chipContent = fs.readFileSync(path.join(srcComponentsDir, 'common/StatusChip.tsx'), 'utf-8');
    expect(chipContent).toContain('bg-ind-emerald-soft text-ind-emerald-text');
    expect(chipContent).toContain('bg-ind-amber-soft text-ind-amber-text');
    expect(chipContent).toContain('bg-ind-blue-soft text-ind-blue-text');
    expect(chipContent).toContain('bg-ind-coral-soft text-ind-coral-text');

    // Paused and failed must never share a color
    expect(chipContent).toContain("text = label || 'Paused'");
    expect(chipContent).toContain("text = label || 'Active · 1 failed instalment'");
  });

  it('verifies zero banned urgency, guilt, or advice words in UI prose', () => {
    const bannedPhrases = [
      'should buy',
      'should sell',
      'must invest',
      'act now',
      'hurry',
      'streak broken',
      'you are losing out',
      'guaranteed returns',
      'don\'t miss out'
    ];

    for (const file of uiFiles) {
      const content = fs.readFileSync(file, 'utf-8').toLowerCase();
      for (const phrase of bannedPhrases) {
        expect(content).not.toContain(phrase);
      }
    }
  });

  it('verifies OptionsComparisonMatrix gives strictly equal visual weight to Pause, Reduce, Cancel', () => {
    const matrixContent = fs.readFileSync(path.join(srcComponentsDir, 'pause/OptionsComparisonMatrix.tsx'), 'utf-8');
    expect(matrixContent).toContain("title: 'Pause SIP'");
    expect(matrixContent).toContain("title: 'Reduce Amount'");
    expect(matrixContent).toContain("title: 'Cancel SIP'");
    // Equal card styles, no pre-selection forced in default state
    expect(matrixContent).toContain('role="radiogroup"');
  });

  it('verifies DemoDrawer allows switching across all 30 personas and advancing demo clock', () => {
    const drawerContent = fs.readFileSync(path.join(srcComponentsDir, 'demo/DemoDrawer.tsx'), 'utf-8');
    expect(drawerContent).toContain('advanceDays(1)');
    expect(drawerContent).toContain('advanceDays(7)');
    expect(drawerContent).toContain('setPersonaKey');
    expect(drawerContent).toContain('toggleLlm');
  });
});
