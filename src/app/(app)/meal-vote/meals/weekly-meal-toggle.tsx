"use client";

import { useSave } from "@/lib/client/save";
import { setWeeklyMealInCache } from "../data";
import { setWeeklyMeal } from "./actions";

export function WeeklyMealToggle({
  mealId,
  isWeekly,
}: {
  mealId: string;
  isWeekly: boolean;
}) {
  const save = useSave();

  // The tick changes on screen straight away; the save runs in the
  // background and is undone if the server refuses it.
  function toggle(next: boolean) {
    void save(() => setWeeklyMeal(mealId, next), {
      keys: [["meals"], ["meal", mealId]],
      optimistic: (qc) => setWeeklyMealInCache(qc, mealId, next),
    });
  }

  return (
    <label className="flex shrink-0 items-center gap-1.5 text-sm text-neutral-700">
      <input
        type="checkbox"
        checked={isWeekly}
        onChange={(e) => toggle(e.target.checked)}
        className="h-4 w-4"
      />
      Weekly meal
    </label>
  );
}
