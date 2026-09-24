"use client";

import { useRouter } from "next/navigation";
import { patch, useSave } from "@/lib/client/save";
import type { MealRow } from "../../../data";
import { deleteMeal } from "./actions";

export function DeleteMealButton({ mealId }: { mealId: string }) {
  const save = useSave();
  const router = useRouter();

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (!confirm("Delete this meal? This can't be undone.")) return;
          // Off to the library straight away with the meal already gone
          // from it; if the server refuses (e.g. it has voting history) the
          // meal reappears there and the reason shows as a toast.
          void save(() => deleteMeal(mealId), {
            keys: [["meals"]],
            optimistic: (qc) =>
              patch<MealRow[]>(qc, ["meals"], (meals) =>
                meals.filter((m) => m.id !== mealId),
              ),
          });
          router.push("/meal-vote/meals");
        }}
        className="text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
      >
        Delete meal
      </button>
    </div>
  );
}
