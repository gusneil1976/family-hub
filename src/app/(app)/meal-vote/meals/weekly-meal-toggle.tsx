"use client";

import { useTransition } from "react";
import { setWeeklyMeal } from "./actions";

export function WeeklyMealToggle({
  mealId,
  isWeekly,
}: {
  mealId: string;
  isWeekly: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex shrink-0 items-center gap-1.5 text-sm text-neutral-700">
      <input
        type="checkbox"
        checked={isWeekly}
        disabled={pending}
        onChange={(e) =>
          startTransition(() => setWeeklyMeal(mealId, e.target.checked))
        }
        className="h-4 w-4"
      />
      Weekly meal
    </label>
  );
}
