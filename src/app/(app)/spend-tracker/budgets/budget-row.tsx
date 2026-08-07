"use client";

import { useState, useTransition } from "react";
import { setBudget } from "./actions";

export function BudgetRow({
  categoryId,
  categoryName,
  month,
  amount,
}: {
  categoryId: string;
  categoryName: string;
  month: string;
  amount: number | null;
}) {
  const [value, setValue] = useState(amount ? String(amount) : "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dirty = value !== (amount ? String(amount) : "");

  return (
    <li className="px-4 py-2 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-neutral-900">{categoryName}</span>
        <div className="flex items-center gap-2">
          <span className="text-neutral-500">£</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0.00"
            className="w-24 rounded-md border border-neutral-300 px-2 py-1 text-right text-sm focus:border-accent focus:outline-none"
          />
          {dirty && (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  try {
                    await setBudget(categoryId, month, value);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Failed to save.");
                  }
                });
              }}
              className="shrink-0 rounded-md bg-accent hover:bg-accent-hover px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
            >
              Save
            </button>
          )}
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </li>
  );
}
