import type { ThreeBlockNarrative } from '@/contracts/coach';
import type { NarrativeTemplate } from '@/content/templates/types';
import { getConfig } from '@/lib/config';
import { defaultLlmClient, type LlmClient } from './llm-client';
import { validateRephrasedProse, type CandidateBlocks, type OriginalBlocks } from './validator';
import { renderTemplate } from './templates';

export interface RephraseContext {
  template: NarrativeTemplate;
  tokens: Record<string, string>;
}

export type RephraseAuditStatus = 'DETERMINISTIC_DEFAULT' | 'REPHRASED' | 'FALLBACK' | 'LLM_DISABLED';

export interface RephraserResult {
  blocks: ThreeBlockNarrative;
  audit: {
    status: RephraseAuditStatus;
    model?: string;
    validationIssues?: string[];
    error?: string;
  };
}

export interface Rephraser {
  rephrase(narrative: ThreeBlockNarrative, context?: RephraseContext): Promise<RephraserResult>;
}

export class NoopRephraser implements Rephraser {
  async rephrase(narrative: ThreeBlockNarrative): Promise<RephraserResult> {
    return {
      blocks: narrative,
      audit: { status: 'DETERMINISTIC_DEFAULT' }
    };
  }
}

export const SYSTEM_PROMPT_ZERO_DIGIT = `You are an editorial assistant for INDmoney SIP Steady.
Your task is to rephrase the explanation blocks to be calm, clear, and supportive for an Indian mutual fund retail investor.

STRICT INVARIANTS (ANY VIOLATION WILL RESULT IN IMMEDIATE AUTOMATIC DISCARD):
1. ZERO-DIGIT DIRECTIVE: You MUST NOT write ANY numerical digits (0, 1, 2, 3, 4, 5, 6, 7, 8, 9) anywhere in your output.
2. NO SPELLED-OUT NUMBERS: Do not write number words (e.g., 'zero', 'one', 'two', 'five', 'twenty', 'double', 'half', 'lakh', 'crore', 'per cent').
3. PLACEHOLDER INTEGRITY: All placeholder tokens (such as {{tenure_months}}, {{invested}}, {{current_value}}, etc.) MUST be preserved EXACTLY as written in the original template. Do not add, remove, rename, or reorder placeholders.
4. NON-ADVICE DIRECTIVE: Do not give financial advice. Never tell the user what they should do, whether to continue or stop their SIP, or predict future market returns.
5. NO BANNED PHRASES: Do not use urgency or guilt language ("act now", "hurry", "stay invested", "don't panic", "streak", "losing money").

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "means": {
    "title": "...",
    "body": "...",
    "keyTakeaway": "..."
  },
  "doesNotMean": {
    "title": "...",
    "body": "...",
    "keyTakeaway": "..."
  }
}`;

export class BoundedGenerativeRephraser implements Rephraser {
  constructor(private readonly llmClient: LlmClient = defaultLlmClient) {}

  async rephrase(narrative: ThreeBlockNarrative, context?: RephraseContext): Promise<RephraserResult> {
    const config = getConfig();

    // Check if LLM is enabled
    if (!config.LLM_ENABLED) {
      return {
        blocks: narrative,
        audit: { status: 'LLM_DISABLED' }
      };
    }

    if (!context) {
      return {
        blocks: narrative,
        audit: { status: 'DETERMINISTIC_DEFAULT' }
      };
    }

    const original: OriginalBlocks = {
      means: {
        title: context.template.means.title,
        body: context.template.means.body,
        keyTakeaway: context.template.means.takeaway
      },
      doesNotMean: {
        title: context.template.doesNotMean.title,
        body: context.template.doesNotMean.body,
        keyTakeaway: context.template.doesNotMean.takeaway
      }
    };

    const userPrompt = JSON.stringify({
      templateId: context.template.id,
      situation: context.template.situation,
      originalBlocks: original
    });

    try {
      // 1. Call LLM with 1500ms timeout
      const rawResponse = await this.llmClient.complete({
        systemPrompt: SYSTEM_PROMPT_ZERO_DIGIT,
        userPrompt
      });

      // 2. Parse JSON response
      let parsedJson: CandidateBlocks;
      try {
        parsedJson = JSON.parse(rawResponse) as CandidateBlocks;
      } catch {
        // AI-E04 / V10: Malformed JSON from LLM
        return {
          blocks: narrative,
          audit: {
            status: 'FALLBACK',
            error: 'Malformed JSON from LLM; reverted to deterministic template.'
          }
        };
      }

      // 3. Strict Validation Gate (Zero digits, placeholders, banned phrases, entities, URLs)
      const validation = validateRephrasedProse(parsedJson, original);
      if (!validation.valid) {
        // Discard generation immediately and revert to deterministic template
        return {
          blocks: narrative,
          audit: {
            status: 'FALLBACK',
            validationIssues: validation.issues,
            error: `Validation failed (${validation.ruleCode}): reverted to deterministic template.`
          }
        };
      }

      // 4. Substitute real figures into placeholders of the validated rephrased blocks
      const rephrasedMeansTitle = renderTemplate(parsedJson.means.title, context.tokens);
      const rephrasedMeansBody = renderTemplate(parsedJson.means.body, context.tokens);
      const rephrasedMeansTakeaway = parsedJson.means.keyTakeaway
        ? renderTemplate(parsedJson.means.keyTakeaway, context.tokens)
        : undefined;

      const rephrasedDoesNotMeanTitle = renderTemplate(parsedJson.doesNotMean.title, context.tokens);
      const rephrasedDoesNotMeanBody = renderTemplate(parsedJson.doesNotMean.body, context.tokens);
      const rephrasedDoesNotMeanTakeaway = parsedJson.doesNotMean.keyTakeaway
        ? renderTemplate(parsedJson.doesNotMean.keyTakeaway, context.tokens)
        : undefined;

      const rephrasedNarrative: ThreeBlockNarrative = {
        figures: narrative.figures, // Integer figures are ALWAYS preserved unaltered
        means: {
          title: rephrasedMeansTitle,
          body: rephrasedMeansBody,
          keyTakeaway: rephrasedMeansTakeaway
        },
        doesNotMean: {
          title: rephrasedDoesNotMeanTitle,
          body: rephrasedDoesNotMeanBody,
          keyTakeaway: rephrasedDoesNotMeanTakeaway
        }
      };

      return {
        blocks: rephrasedNarrative,
        audit: {
          status: 'REPHRASED',
          model: config.LLM_MODEL
        }
      };
    } catch (err: unknown) {
      // AI-E04 / Network / Timeout errors
      return {
        blocks: narrative,
        audit: {
          status: 'FALLBACK',
          error: (err as Error)?.message ?? 'LLM completion failed; reverted to deterministic template.'
        }
      };
    }
  }
}

export const defaultRephraser = new BoundedGenerativeRephraser();
