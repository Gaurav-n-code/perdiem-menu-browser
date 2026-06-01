import type { ApiError, SquareErrorDetail } from "@/types";

function isSquareApiError(
  err: unknown
): err is { errors: Array<{ category: string; code: string; detail?: string; field?: string }> } {
  return (
    typeof err === "object" &&
    err !== null &&
    "errors" in err &&
    Array.isArray((err as Record<string, unknown>)["errors"])
  );
}


export function toApiError(err: unknown): ApiError {
  if (isSquareApiError(err)) {
    const squareErrors: SquareErrorDetail[] = err.errors.map((e) => {
      const squareError: SquareErrorDetail = {
        category: e.category,
        code: e.code,
      };

      if (typeof e.detail === "string") {
        squareError.detail = e.detail;
      }

      if (typeof e.field === "string") {
        squareError.field = e.field;
      }

      return squareError;
    });

    // Surface the first Square error message as the top-level string
    const first = err.errors[0];
    const message = first?.detail ?? first?.code ?? "Square API error";

    return { error: message, squareErrors };
  }

  if (err instanceof Error) {
    return { error: err.message };
  }

  return { error: "An unexpected error occurred" };
}

/**
 * Returns true if the Square error code indicates a rate-limit hit.
 * Callers can use this to decide whether to retry with backoff.
 */
export function isRateLimitError(apiError: ApiError): boolean {
  return (
    apiError.squareErrors?.some((e) => e.code === "RATE_LIMITED") ?? false
  );
}
