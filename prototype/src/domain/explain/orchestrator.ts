import { getProvider } from '@/data';
import type { ISODate } from '@/lib/dates';
import { notFound } from '@/lib/errors';
import { computeMetrics } from '@/domain/returns/engine';
import { computeConfidence } from '@/domain/confidence/confidence';
import { selectSources } from '@/domain/sources/select';
import { selectTemplate } from '@/content/templates/catalog';
import { TERMS } from '@/content/terms';
import { DISCLAIMER_TEXT, NON_ADVICE_REFUSAL } from '@/content/refusal';
import { CoachResponse, type CoachIntent, type TermKey, type TermDefinition } from '@/contracts/coach';
import { renderTemplate, resolveTokens } from './templates';
import { classifyIntent } from './intent-guard';
import { defaultRephraser, type Rephraser } from './rephraser';

export interface ExplainReturnOptions {
  sipId: string;
  intent?: CoachIntent;
  prompt?: string;
  termKey?: TermKey;
  asOf?: string;
  rephraser?: Rephraser;
}

/**
 * Orchestrates the Return Coach response.
 * Flow: Ingestion -> Intent/Advice Guard -> Financial Metrics Engine -> Template Selection ->
 *       Placeholder Formatting -> Source Matching -> Confidence Score -> Structured Output.
 */
export async function explainReturn(options: ExplainReturnOptions): Promise<CoachResponse> {
  const startMs = Date.now();
  const { sipId, prompt, intent: requestedIntent, termKey, asOf: requestedAsOf } = options;

  // 1. Ingestion: resolve SIP bundle
  const provider = getProvider();
  const bundle = await provider.getSip(sipId, requestedAsOf);
  if (!bundle) {
    throw notFound(`We could not find SIP with reference ${sipId}`);
  }

  const asOf = (requestedAsOf ?? bundle.valuation?.asOfDate ?? bundle.sip.investmentDate) as ISODate;

  // 2. Intent Guard: intercept advice-seeking inputs deterministically
  const intentResult = classifyIntent(prompt, requestedIntent);
  if (intentResult.isAdvice) {
    const refusalLatency = Date.now() - startMs;
    const refusalResponse: CoachResponse = {
      sipId,
      asOf,
      isRefusal: true,
      refusal: NON_ADVICE_REFUSAL,
      disclaimer: DISCLAIMER_TEXT,
      blocks: null,
      termDefinitions: [TERMS.VOLATILITY, TERMS.UNREALISED_RETURN],
      sources: selectSources({ situation: 'NEGATIVE', stage: 'M1_3', topic: 'DISCLAIMER' }),
      confidence: {
        label: 'HIGH',
        reasons: ['FIGURES_COMPLETE', 'RULE_MATCHED', 'SOURCE_ATTACHED', 'VALIDATED']
      },
      audit: {
        templateId: 'REFUSAL_STATIC',
        latencyMs: refusalLatency
      },
      isMock: true,
      dataLabel: 'DEMO DATA'
    };
    return CoachResponse.parse(refusalResponse);
  }

  // 3. Deterministic return metrics computation (Phase 2 core)
  const { metrics, detail } = computeMetrics(bundle, asOf);

  // 4. Resolve placeholders
  const tokens = resolveTokens(bundle, metrics, detail);

  // 5. Select template and render narrative blocks
  const template = selectTemplate(metrics.situation, metrics.stage);

  const figuresBlock = {
    investedPaise: metrics.investedPaise,
    investedFormatted: tokens.invested,
    currentValuePaise: metrics.currentValuePaise,
    currentValueFormatted: tokens.current_value,
    absoluteReturnPaise: metrics.absoluteReturnPaise,
    absoluteReturnFormatted: tokens.abs_return,
    absoluteReturnPct: metrics.absoluteReturnPct,
    absoluteReturnPctFormatted: tokens.abs_return_pct,
    xirrPct: metrics.xirrPct,
    xirrFormatted: tokens.xirr_pct,
    instalmentsPaid: metrics.instalmentsPaid,
    tenureMonths: metrics.tenureMonths,
    stage: metrics.stage,
    situation: metrics.situation,
    summaryText: renderTemplate(template.figuresSummary, tokens)
  };

  const rawBlocks = {
    figures: figuresBlock,
    means: {
      title: renderTemplate(template.means.title, tokens),
      body: renderTemplate(template.means.body, tokens),
      keyTakeaway: template.means.takeaway ? renderTemplate(template.means.takeaway, tokens) : undefined
    },
    doesNotMean: {
      title: renderTemplate(template.doesNotMean.title, tokens),
      body: renderTemplate(template.doesNotMean.body, tokens),
      keyTakeaway: template.doesNotMean.takeaway ? renderTemplate(template.doesNotMean.takeaway, tokens) : undefined
    }
  };

  // 6. Optional Rephraser (Bounded Generative Edge in Phase 6)
  const rephraser = options.rephraser ?? defaultRephraser;
  const rephraseOutcome = await rephraser.rephrase(rawBlocks, { template, tokens });
  const blocks = rephraseOutcome.blocks;

  // 7. Deterministic Source Selection
  const sources = selectSources({
    situation: metrics.situation,
    stage: metrics.stage,
    shortPeriodXirr: detail.xirrAnnualisedShortPeriod
  });

  // 8. Term definitions selection
  const termDefinitions: TermDefinition[] = [];
  if (termKey && TERMS[termKey]) {
    termDefinitions.push(TERMS[termKey]);
  }
  // Standard educational terms relevant to current state
  termDefinitions.push(TERMS.ABSOLUTE_RETURN);
  termDefinitions.push(TERMS.NAV);
  if (metrics.xirrPct !== null || detail.xirrAnnualisedShortPeriod) {
    if (!termDefinitions.some((t) => t.key === 'XIRR')) {
      termDefinitions.push(TERMS.XIRR);
    }
  }
  if (['NEGATIVE', 'SMALL_NEGATIVE', 'FLAT'].includes(metrics.situation)) {
    if (!termDefinitions.some((t) => t.key === 'VOLATILITY')) {
      termDefinitions.push(TERMS.VOLATILITY);
    }
    if (!termDefinitions.some((t) => t.key === 'UNREALISED_RETURN')) {
      termDefinitions.push(TERMS.UNREALISED_RETURN);
    }
  }

  // 9. Deterministic Confidence Rating
  const figuresComplete = metrics.currentValuePaise !== null &&
    !detail.flags.includes('VALUATION_MISSING') &&
    !detail.flags.includes('VALUATION_DATE_MISMATCH') &&
    !detail.flags.includes('VALUATION_SUSPECT') &&
    !detail.flags.includes('NO_SUCCESSFUL_INSTALMENT');

  const ruleMatched = metrics.situation !== 'INSUFFICIENT_DATA';
  const confidence = computeConfidence({
    figuresComplete,
    ruleMatched,
    xirrNeeded: metrics.tenureMonths >= 12,
    xirrAvailable: metrics.xirrPct !== null,
    xirrMismatch: detail.xirrMismatch,
    verifiedSourceCount: sources.length,
    validation: 'TEMPLATE_PATH',
    outOfScope: false,
    generalEducationOnly: false
  });

  const latencyMs = Date.now() - startMs;

  const response: CoachResponse = {
    sipId,
    asOf,
    isRefusal: false,
    refusal: null,
    disclaimer: DISCLAIMER_TEXT,
    blocks,
    termDefinitions,
    sources,
    confidence,
    audit: {
      templateId: template.id,
      latencyMs,
      rephraseStatus: rephraseOutcome.audit.status,
      model: rephraseOutcome.audit.model,
      validationIssues: rephraseOutcome.audit.validationIssues
    },
    isMock: true,
    dataLabel: 'DEMO DATA'
  };

  return CoachResponse.parse(response);
}
