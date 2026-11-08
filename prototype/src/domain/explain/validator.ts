import { ALLOWED_TOKENS } from './templates';
import { findBannedPhrases } from '@/lib/banned-phrases';

/**
 * Strict Validation Gate for LLM-generated prose (docs/architecture.md Section 5 & evaluation-framework.md Section 7).
 * Evaluates candidate rephrased blocks against:
 *  1. Zero-Digit Directive (F3 / AI-E01 / V1)
 *  2. Spelled-out numbers & units (F3 / D-10 / V8)
 *  3. Placeholder integrity (F2 / AI-E02 / V2, V4, V9, V13)
 *  4. Banned-phrase & advice filter (S2 / AI-E03 / V6, V7)
 *  5. Entity whitelist & external schemes (S3 / AI-E05 / V5)
 *  6. Forbidden URLs & citations (G1 / V11)
 *  7. Unsupported fee/tax claims (C1 / V14)
 *  8. Length bounds & structural integrity (V10, V12)
 */

export interface ValidationResult {
  valid: boolean;
  issues: string[];
  ruleCode?: string;
}

export interface NarrativeSection {
  title: string;
  body: string;
  keyTakeaway?: string;
}

export interface CandidateBlocks {
  means: NarrativeSection;
  doesNotMean: NarrativeSection;
}

export interface OriginalBlocks {
  means: NarrativeSection;
  doesNotMean: NarrativeSection;
}

const SPELLED_NUMBERS_RX = /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|lakh|crore|million|billion|per\s*cent|percentage|half|double|twice|triple|quarter)\b/i;

const FORBIDDEN_ENTITIES_RX = /\b(HDFC|ICICI|SBI|Axis|Nippon|Kotak|Tata|Parag Parikh|Mirae|UTI|Nifty|Sensex|BSE|NSE|Bitcoin|crypto)\b/i;

const FORBIDDEN_URLS_RX = /\b(https?:\/\/|www\.|\.com|\.org|\.in\/)\b/i;

const FORBIDDEN_FEE_CLAIMS_RX = /\b(penalty fee|late charge|exit load of|tax penalty|deduction of)\b/i;

const PLACEHOLDER_EXTRACT_RX = /\{\{([a-zA-Z0-9_]+)\}\}/g;

export function extractPlaceholders(text: string): string[] {
  const matches: string[] = [];
  const rx = new RegExp(PLACEHOLDER_EXTRACT_RX);
  let m: RegExpExecArray | null;
  while ((m = rx.exec(text)) !== null) {
    matches.push(m[1]!);
  }
  return matches;
}

export function stripPlaceholders(text: string): string {
  return text.replaceAll(/\{\{[a-zA-Z0-9_]+\}\}/g, ' ');
}

export function validateRephrasedProse(
  candidate: CandidateBlocks,
  original: OriginalBlocks,
  allowedTokens: readonly string[] = ALLOWED_TOKENS
): ValidationResult {
  const issues: string[] = [];

  // V10: Structural schema check
  if (!candidate || !candidate.means || !candidate.doesNotMean) {
    return { valid: false, issues: ['Malformed response: missing means or doesNotMean blocks.'], ruleCode: 'MALFORMED_SCHEMA' };
  }

  const sections: Array<{ name: string; cand: NarrativeSection; orig: NarrativeSection }> = [
    { name: 'means', cand: candidate.means, orig: original.means },
    { name: 'doesNotMean', cand: candidate.doesNotMean, orig: original.doesNotMean }
  ];

  for (const { name, cand, orig } of sections) {
    if (typeof cand.title !== 'string' || typeof cand.body !== 'string') {
      issues.push(`Invalid block structure in ${name}: title and body must be strings.`);
      continue;
    }

    const fields: Array<{ fieldName: string; text: string; origText?: string }> = [
      { fieldName: `${name}.title`, text: cand.title, origText: orig.title },
      { fieldName: `${name}.body`, text: cand.body, origText: orig.body }
    ];
    if (cand.keyTakeaway !== undefined) {
      fields.push({ fieldName: `${name}.keyTakeaway`, text: cand.keyTakeaway, origText: orig.keyTakeaway });
    }

    for (const { fieldName, text, origText } of fields) {
      const stripped = stripPlaceholders(text);

      // 1. Zero-Digit Directive (V1 / AI-E01 / F3)
      if (/\d/.test(stripped)) {
        return {
          valid: false,
          issues: [`Zero-digit violation in ${fieldName}: numeric digit found outside placeholder tokens.`],
          ruleCode: 'ZERO_DIGIT_DETECTED'
        };
      }

      // 2. Spelled-Out Numbers (V8 / D-10 / F3)
      const spelledMatch = stripped.match(SPELLED_NUMBERS_RX);
      if (spelledMatch) {
        return {
          valid: false,
          issues: [`Spelled-out number detected in ${fieldName}: "${spelledMatch[0]}"`],
          ruleCode: 'SPELLED_NUMBER_DETECTED'
        };
      }

      // 3. Banned Phrase & Advice Filter (V6, V7 / AI-E03 / S2)
      const banned = findBannedPhrases(text);
      if (banned.length > 0) {
        return {
          valid: false,
          issues: [`Banned phrase detected in ${fieldName}: ${banned.map((b) => b.match).join(', ')}`],
          ruleCode: 'BANNED_PHRASE_DETECTED'
        };
      }

      // 4. Entity Whitelist Check (V5 / AI-E05 / S3)
      const entityMatch = stripped.match(FORBIDDEN_ENTITIES_RX);
      if (entityMatch) {
        return {
          valid: false,
          issues: [`Unapproved external entity or ticker in ${fieldName}: "${entityMatch[0]}"`],
          ruleCode: 'FORBIDDEN_ENTITY_DETECTED'
        };
      }

      // 5. Forbidden URLs (V11 / G1)
      if (FORBIDDEN_URLS_RX.test(text)) {
        return {
          valid: false,
          issues: [`Forbidden URL or domain reference in ${fieldName}.`],
          ruleCode: 'FORBIDDEN_URL_DETECTED'
        };
      }

      // 6. Forbidden Fee/Tax Claims (V14 / C1)
      if (FORBIDDEN_FEE_CLAIMS_RX.test(text)) {
        return {
          valid: false,
          issues: [`Unsupported fee or charge claim in ${fieldName}.`],
          ruleCode: 'UNSUPPORTED_FEE_CLAIM'
        };
      }

      // 7. Length Bounds Check (V12)
      if (fieldName.endsWith('.body')) {
        if (origText && (text.length < origText.length * 0.4 || text.length > origText.length * 2.5)) {
          return {
            valid: false,
            issues: [`Length bound violation in ${fieldName}: length ${text.length} outside allowed 0.4x - 2.5x bounds.`],
            ruleCode: 'LENGTH_BOUND_VIOLATION'
          };
        }
      }

      // 8. Placeholder Integrity Check (V2, V4, V9, V13 / AI-E02 / F2)
      const candPlaceholders = extractPlaceholders(text);
      const origPlaceholders = origText ? extractPlaceholders(origText) : [];

      // Check for unknown placeholders (V4)
      for (const token of candPlaceholders) {
        if (!allowedTokens.includes(token)) {
          return {
            valid: false,
            issues: [`Unknown placeholder token in ${fieldName}: {{${token}}}`],
            ruleCode: 'UNKNOWN_PLACEHOLDER'
          };
        }
      }

      // Check that all required placeholders in orig are preserved in candidate (V2, V9, V13)
      if (origText) {
        const origSorted = [...origPlaceholders].sort();
        const candSorted = [...candPlaceholders].sort();

        if (origSorted.length !== candSorted.length || !origSorted.every((t, i) => t === candSorted[i])) {
          return {
            valid: false,
            issues: [
              `Placeholder count or identity mismatch in ${fieldName}. Expected [${origSorted.join(', ')}], found [${candSorted.join(', ')}].`
            ],
            ruleCode: 'PLACEHOLDER_MISMATCH'
          };
        }
      }
    }
  }

  if (issues.length > 0) {
    return { valid: false, issues };
  }

  return { valid: true, issues: [] };
}
