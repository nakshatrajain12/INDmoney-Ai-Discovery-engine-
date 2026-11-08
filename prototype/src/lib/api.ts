import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError, type ErrorEnvelope } from './errors';
import { ConfigError } from './config';
import { logger } from './logger';

export type RouteParams = Record<string, string | string[]>;

export interface ApiContext {
  requestId: string;
  request: Request;
  /** Resolved dynamic route parameters (Next 16 passes them as a Promise). */
  params: RouteParams;
}

/**
 * Wraps a route handler: adds a requestId, validates nothing itself, logs one line per request and
 * maps every failure to the calm error envelope. Stack traces stay in server logs only.
 * Success shape: { requestId, data }.  Error shape: { requestId, error: { code, message, retryable, fallbackShown } }.
 */
export function withApi<T>(handler: (ctx: ApiContext) => Promise<T> | T) {
  return async (request: Request, ...rest: unknown[]): Promise<Response> => {
    const route = rest[0] as { params?: Promise<RouteParams> } | undefined;
    const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
    const started = Date.now();
    const path = new URL(request.url).pathname;
    try {
      const params = route?.params ? await route.params : {};
      const data = await handler({ requestId, request, params });
      logger.info('request', { requestId, method: request.method, path, status: 200, ms: Date.now() - started });
      return NextResponse.json({ requestId, data }, { status: 200, headers: { 'x-request-id': requestId, 'cache-control': 'no-store' } });
    } catch (err) {
      let body: ErrorEnvelope;
      let status = 500;
      if (err instanceof AppError) {
        status = err.status;
        body = { requestId, error: { code: err.code, message: err.userMessage, retryable: err.retryable, fallbackShown: err.fallbackShown } };
      } else if (err instanceof ZodError) {
        status = 400;
        body = { requestId, error: { code: 'INVALID_INPUT', message: 'Some of the information provided isn’t valid.', retryable: false, fallbackShown: false } };
      } else if (err instanceof ConfigError) {
        body = { requestId, error: { code: 'CONFIG_ERROR', message: 'The service isn’t configured correctly.', retryable: false, fallbackShown: false } };
      } else {
        body = { requestId, error: { code: 'INTERNAL', message: 'Something went wrong on our side.', retryable: true, fallbackShown: false } };
      }
      logger.error('request failed', { requestId, method: request.method, path, status, code: body.error.code, ms: Date.now() - started, detail: err instanceof Error ? err.message : String(err) });
      return NextResponse.json(body, { status, headers: { 'x-request-id': requestId, 'cache-control': 'no-store' } });
    }
  };
}
