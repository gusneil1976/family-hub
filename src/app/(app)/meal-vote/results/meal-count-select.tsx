"use client";

import { useTransition } from "react";
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
  const [pending, startTransition] = useTransition();
  // Include the current value even if it's above max (e.g. the shortlist
  // shrank since it was set), so the select never silently drops it.
  const optionCount = Math.max(max, value);
  const options = Array.from({ length: optionCount }, (_, i) => i + 1);

  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) =>
        startTransition(() =>
          setShoppingListMealCount(cycleId, Number(e.target.value)),
        )
      }
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
