/** Public error contract for the shared kernel (`@/lib/errors`). */

export type ErrorBody = { error: { code: string; message: string } };

/** A domain error carrying a stable code and an HTTP status (APP_SPEC §11). */
export class AppError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly httpStatus: number = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** The wire shape for every error response. */
export function toErrorBody(code: string, message: string): ErrorBody {
  return { error: { code, message } };
}

/**
 * Map any thrown value to a safe HTTP response. Known domain errors expose
 * their code/message; anything else collapses to a generic 500, so stack
 * traces and secrets never leak to the client (§11).
 */
export function toErrorResponse(error: unknown): {
  status: number;
  body: ErrorBody;
} {
  if (error instanceof AppError) {
    return {
      status: error.httpStatus,
      body: toErrorBody(error.code, error.message),
    };
  }
  return { status: 500, body: toErrorBody("internal_error", "Something went wrong.") };
}
