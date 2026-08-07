"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteMeal } from "./actions";

export function DeleteMealButton({ mealId }: { mealId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm("Delete this meal? This can't be undone.")) return;
          setError(null);
          startTransition(async () => {
            try {
              await deleteMeal(mealId);
              router.push("/meal-vote/meals");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed to delete.");
            }
          });
        }}
        className="text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
      >
        Delete meal
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
