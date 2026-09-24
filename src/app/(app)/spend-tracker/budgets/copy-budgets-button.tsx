"use client";

import { useSave } from "@/lib/client/save";
import { copyBudgetsInCache } from "../data";
import { copyBudgetsFromPreviousMonth } from "./actions";

export function CopyBudgetsButton({
  month,
  previousMonth,
}: {
  month: string;
  previousMonth: string;
}) {
  const save = useSave();

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          // Fills the empty rows from last month's cached figures straight
          // away; the re-sync afterwards confirms what the server saved.
          void save(() => copyBudgetsFromPreviousMonth(month, previousMonth), {
            keys: [["budgets", month]],
            optimistic: (qc) => copyBudgetsInCache(qc, month, previousMonth),
          });
        }}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
      >
        Copy from previous month
      </button>
    </div>
  );
}
