"use client";

import type { VotingCycle } from "@/lib/types";
import { patch, useSave } from "@/lib/client/save";
import { RESULTS_CYCLE } from "../data";
import { setShoppingListMealCount } from "./actions";

export function MealCountSelect({
  cycleId,
  value,
  max,
}: {
  cycleId: string;
  value: number;
  max: number;
}) {
  const save = useSave();
  // Include the current value even if it's above max (e.g. the shortlist
  // shrank since it was set), so the select never silently drops it.
  const optionCount = Math.max(max, value);
  const options = Array.from({ length: optionCount }, (_, i) => i + 1);

  // The shopping list below re-forms around the new count straight away.
  function change(count: number) {
    void save(() => setShoppingListMealCount(cycleId, count), {
      keys: [["voting-cycle"], ["checklist"]],
      optimistic: (qc) =>
        patch<VotingCycle | null>(qc, RESULTS_CYCLE, (c) =>
          c && c.id === cycleId ? { ...c, shopping_list_meal_count: count } : c,
        ),
    });
  }

  return (
    <select
      value={value}
      onChange={(e) => change(Number(e.target.value))}
      className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm font-semibold focus:border-accent focus:outline-none disabled:opacity-50"
    >
      {options.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );
}
