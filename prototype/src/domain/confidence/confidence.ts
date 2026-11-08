/**
 * Deterministic confidence label (docs/architecture.md section 6.4). Pure function of its inputs; table-driven tests.
 * Precedence: LOW rules first, then MEDIUM, otherwise HIGH.
 */
export type ConfidenceLabel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ConfidenceInput {
  /** I, V, valuation date and tenure are all present. */
  figuresComplete: boolean;
  /** The situation matched a rule (not INSUFFICIENT_DATA). */
  ruleMatched: boolean;
  /** XIRR is part of this explanation block. */
  xirrNeeded: boolean;
  xirrAvailable: boolean;
  xirrMismatch: boolean;
  verifiedSourceCount: number;
  /** PASSED = model output passed the validator; TEMPLATE_PATH = template only, no model; FAILED = fall back. */
  validation: 'PASSED' | 'TEMPLATE_PATH' | 'FAILED';
  outOfScope: boolean;
  /** Only general education, no personal figures. */
  generalEducationOnly: boolean;
}

export type ConfidenceReason =
  | 'FIGURES_COMPLETE' | 'RULE_MATCHED' | 'SOURCE_ATTACHED' | 'VALIDATED'
  | 'INSUFFICIENT_DATA' | 'NO_RULE_MATCH' | 'NO_VERIFIED_SOURCE' | 'OUT_OF_SCOPE' | 'VALIDATOR_FAILED'
  | 'XIRR_MISMATCH' | 'XIRR_MISSING' | 'GENERAL_EDUCATION_ONLY';

export interface ConfidenceResult {
  label: ConfidenceLabel;
  reasons: ConfidenceReason[];
}

export function computeConfidence(i: ConfidenceInput): ConfidenceResult {
  const low: ConfidenceReason[] = [];
  if (!i.figuresComplete) low.push('INSUFFICIENT_DATA');
  if (!i.ruleMatched) low.push('NO_RULE_MATCH');
  if (i.verifiedSourceCount < 1) low.push('NO_VERIFIED_SOURCE');
  if (i.outOfScope) low.push('OUT_OF_SCOPE');
  if (i.validation === 'FAILED') low.push('VALIDATOR_FAILED');
  if (low.length > 0) return { label: 'LOW', reasons: low };

  const medium: ConfidenceReason[] = [];
  if (i.xirrMismatch) medium.push('XIRR_MISMATCH');
  if (i.xirrNeeded && !i.xirrAvailable) medium.push('XIRR_MISSING');
  if (i.generalEducationOnly) medium.push('GENERAL_EDUCATION_ONLY');
  if (medium.length > 0) return { label: 'MEDIUM', reasons: medium };

  return { label: 'HIGH', reasons: ['FIGURES_COMPLETE', 'RULE_MATCHED', 'SOURCE_ATTACHED', 'VALIDATED'] };
}
