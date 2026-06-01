"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * Full-width error display with an optional retry action.
 * Used for API failures where the user can meaningfully do something.
 */
export function ErrorState({
  message = "Unable to load menu.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center"
    >
      <AlertCircle className="h-10 w-10 text-red-400" aria-hidden />
      <div>
        <p className="font-semibold text-red-800">{message}</p>
        <p className="mt-1 text-sm text-red-600">
          Check your connection and try again.
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
