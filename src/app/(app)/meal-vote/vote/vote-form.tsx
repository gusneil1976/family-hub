"use client";

import { useActionState, useState } from "react";
import type { Meal } from "@/lib/types";
import { MealImage } from "../meals/meal-image";

type ActionState = { error: string } | undefined;

export function VoteForm({
  meals,
  initialSelected,
  action,
}: {
  meals: Meal[];
  initialSelected: string[];
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [selected, setSelected] = useState<string[]>(initialSelected);

  function toggle(mealId: string) {
    setSelected((prev) =>
      prev.includes(mealId)
        ? prev.filter((id) => id !== mealId)
        : prev.length < 3
          ? [...prev, mealId]
          : prev,
    );
  }

  return (
    <form action={formAction}>
      <ul className="mb-4 divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
        {meals.map((meal) => {
          const checked = selected.includes(meal.id);
          const disabled = !checked && selected.length >= 3;
          return (
            <li key={meal.id}>
              <label
                className={`flex min-h-12 flex-1 items-center gap-3 px-4 py-3 text-base ${
                  disabled ? "text-neutral-400" : "text-neutral-900"
                }`}
              >
                <input
                  type="checkbox"
                  name="meal_id"
                  value={meal.id}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(meal.id)}
                  className="h-5 w-5 shrink-0 accent-[var(--accent)]"
                />
                {meal.image_url ? (
                  <MealImage
                    src={meal.image_url}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <span className="h-16 w-16 shrink-0 rounded-md bg-neutral-100" />
                )}
                {meal.name}
              </label>
            </li>
          );
        })}
      </ul>

      <p className="mb-2 text-sm text-neutral-500">
        {selected.length} / 3 selected
      </p>

      {state?.error && (
        <p className="mb-2 text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending || selected.length === 0}
        className="rounded-md bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save my votes"}
      </button>
    </form>
  );
}
