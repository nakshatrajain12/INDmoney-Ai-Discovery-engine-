import { getConfig, getLlmApiKey } from '@/lib/config';

/**
 * Server-side completion caller for generative AI edge (architecture.md Section 5).
 * Enforces a strict 1,500ms timeout (AI-E04).
 */

export const LLM_TIMEOUT_MS = 1500;

export interface LlmCompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  timeoutMs?: number;
}

export interface LlmClient {
  complete(request: LlmCompletionRequest): Promise<string>;
}

export class DefaultLlmClient implements LlmClient {
  async complete(request: LlmCompletionRequest): Promise<string> {
    const config = getConfig();
    const apiKey = getLlmApiKey();

    if (!config.LLM_ENABLED || !apiKey) {
      throw new Error('LLM service is disabled or not configured.');
    }

    const timeoutMs = request.timeoutMs ?? LLM_TIMEOUT_MS;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // In production with Gemini:
      const provider = config.LLM_PROVIDER?.toLowerCase() ?? 'gemini';
      const model = config.LLM_MODEL ?? 'gemini-1.5-flash';

      let endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      let bodyPayload: unknown;

      if (provider === 'gemini') {
        bodyPayload = {
          systemInstruction: { parts: [{ text: request.systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: request.userPrompt }] }],
          generationConfig: {
            temperature: request.temperature ?? 0.2,
            responseMimeType: 'application/json'
          }
        };
      } else {
        // Generic OpenAI-compatible endpoint
        endpoint = 'https://api.openai.com/v1/chat/completions';
        bodyPayload = {
          model,
          messages: [
            { role: 'system', content: request.systemPrompt },
            { role: 'user', content: request.userPrompt }
          ],
          temperature: request.temperature ?? 0.2,
          response_format: { type: 'json_object' }
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(provider !== 'gemini' ? { Authorization: `Bearer ${apiKey}` } : {})
        },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`LLM provider returned HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json() as Record<string, unknown>;

      if (provider === 'gemini') {
        const candidates = json.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined;
        const text = candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('No candidate content received from Gemini.');
        return text;
      } else {
        const choices = json.choices as Array<{ message?: { content?: string } }> | undefined;
        const text = choices?.[0]?.message?.content;
        if (!text) throw new Error('No completion choice received from OpenAI.');
        return text;
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        // AI-E04: LLM timeout
        throw new Error(`LLM call timed out after ${timeoutMs}ms.`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export const defaultLlmClient = new DefaultLlmClient();
