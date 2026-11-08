/** Application errors map to the user-facing envelope in docs/architecture.md section 11. */
export type ErrorCode =
  | 'INVALID_INPUT'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'PROVIDER_UNAVAILABLE'
  | 'CONFIG_ERROR'
  | 'INTERNAL';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    /** Plain, calm text that is safe to show to a user. Never include internals here. */
    public readonly userMessage: string,
    public readonly status: number,
    public readonly retryable = false,
    public readonly fallbackShown = false
  ) {
    super(userMessage);
    this.name = 'AppError';
  }
}

export const invalidInput = (msg: string) => new AppError('INVALID_INPUT', msg, 400);
export const notFound = (msg = 'We couldn’t find that.') => new AppError('NOT_FOUND', msg, 404);
export const conflict = (msg: string) => new AppError('CONFLICT', msg, 409);
export const providerUnavailable = (msg = 'We can’t load this right now.') => new AppError('PROVIDER_UNAVAILABLE', msg, 503, true, true);

export interface ErrorEnvelope {
  requestId: string;
  error: { code: ErrorCode; message: string; retryable: boolean; fallbackShown: boolean };
}
