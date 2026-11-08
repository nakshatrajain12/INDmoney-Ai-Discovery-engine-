import { withApi } from '@/lib/api';
import { invalidInput } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { SipIdParam } from '@/contracts/api';
import { CoachRequest } from '@/contracts/coach';
import { explainReturn } from '@/domain/explain/orchestrator';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/sips/{id}/coach
 * Body: { intent?: 'EXPLAIN_RETURN' | 'EXPLAIN_TERM' | 'WHAT_IS_NORMAL', prompt?: string, termKey?: string, asOf?: string }
 * Returns structured 3-block narrative, verified sources, confidence score, and non-advice disclaimer.
 */
export const POST = withApi(async ({ request, params }) => {
  const idResult = SipIdParam.safeParse(params.id);
  if (!idResult.success) {
    throw invalidInput('That SIP reference is not valid.');
  }

  let body = {};
  try {
    const text = await request.text();
    if (text && text.trim().length > 0) {
      body = JSON.parse(text);
    }
  } catch {
    throw invalidInput('Request payload must be valid JSON.');
  }

  const reqResult = CoachRequest.safeParse(body);
  if (!reqResult.success) {
    throw invalidInput('Coach request parameters are not valid.');
  }

  const response = await explainReturn({
    sipId: idResult.data,
    intent: reqResult.data.intent,
    prompt: reqResult.data.prompt,
    termKey: reqResult.data.termKey,
    asOf: reqResult.data.asOf
  });

  // Anonymized audit logging for explanation generation (Phase 9 requirement)
  logger.info('coach_explanation_generated', {
    sipId: idResult.data,
    isRefusal: response.isRefusal,
    templateId: response.audit.templateId,
    latencyMs: response.audit.latencyMs,
    rephraseStatus: response.audit.rephraseStatus,
    model: response.audit.model
  });

  return response;
});

