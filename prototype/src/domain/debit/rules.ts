import { z } from 'zod';
import rawRules from '@/rules/debit-rules.v1.json';
import {
  DebitAction,
  DebitFailureCategory,
  DebitStatusChip,
  SecondaryDebitAction
} from '@/contracts/debit';

export const DebitRuleItemSchema = z.object({
  category: DebitFailureCategory,
  ruleId: z.string().min(1),
  providerCodes: z.array(z.string()),
  humanReason: z.string().min(1),
  sipStatusImpact: z.string().min(1),
  sipStatusDetail: z.string().min(1),
  statusChip: DebitStatusChip,
  isSipActive: z.boolean(),
  isMandateActive: z.boolean(),
  isMandateRevoked: z.boolean(),
  retryAllowed: z.boolean(),
  autoRetryExpected: z.boolean(),
  nextAction: DebitAction,
  secondaryAction: SecondaryDebitAction.nullable().optional(),
  consequenceNotice: z.string().nullable()
});
export type DebitRuleItem = z.infer<typeof DebitRuleItemSchema>;

export const DebitRulesConfigSchema = z.object({
  version: z.string().min(1),
  reviewStatus: z.string().min(1),
  description: z.string().min(1),
  rules: z.array(DebitRuleItemSchema)
});
export type DebitRulesConfig = z.infer<typeof DebitRulesConfigSchema>;

/**
 * Parsed and validated at load time. Fails fast if debit-rules.v1.json is corrupted or violates the schema.
 */
export const DEBIT_RULES: DebitRulesConfig = DebitRulesConfigSchema.parse(rawRules);

const RULES_BY_CATEGORY = new Map<DebitFailureCategory, DebitRuleItem>(
  DEBIT_RULES.rules.map((r) => [r.category, r])
);

export const GENERIC_UNKNOWN_RULE: DebitRuleItem = RULES_BY_CATEGORY.get('GENERIC_UNKNOWN')!;
if (!GENERIC_UNKNOWN_RULE) {
  throw new Error('Debit rules matrix must define GENERIC_UNKNOWN category');
}

/**
 * Deterministic lookup for a reason code.
 * Matches by category name or by providerCodes entry (case-insensitive).
 * Returns GENERIC_UNKNOWN if unmapped or null (never throws, never guesses).
 */
export function lookupDebitRule(reasonCode: string | null | undefined): DebitRuleItem {
  if (!reasonCode || reasonCode.trim().length === 0) {
    return GENERIC_UNKNOWN_RULE;
  }

  const normalized = reasonCode.trim().toUpperCase();

  // 1. Direct category match
  if (RULES_BY_CATEGORY.has(normalized as DebitFailureCategory)) {
    return RULES_BY_CATEGORY.get(normalized as DebitFailureCategory)!;
  }

  // 2. Mapped provider code match
  for (const rule of DEBIT_RULES.rules) {
    if (rule.providerCodes.some((code) => code.toUpperCase() === normalized)) {
      return rule;
    }
  }

  // 3. Safe fallback for unmapped codes
  return GENERIC_UNKNOWN_RULE;
}

export function getDebitRuleByCategory(category: DebitFailureCategory): DebitRuleItem {
  return RULES_BY_CATEGORY.get(category) ?? GENERIC_UNKNOWN_RULE;
}

