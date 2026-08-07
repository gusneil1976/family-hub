"use client";

import { useState, useTransition } from "react";
import { copyBudgetsFromPreviousMonth } from "./actions";

export function CopyBudgetsButton({
  month,
  previousMonth,
}: {
  month: string;
  previousMonth: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await copyBudgetsFromPreviousMonth(month, previousMonth);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed to copy.");
            }
          });
        }}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
      >
        {pending ? "Copying…" : "Copy from previous month"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
