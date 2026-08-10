"use client";

import { useActionState, useState } from "react";
import { Check, UtensilsCrossed } from "lucide-react";
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
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {meals.map((meal) => {
          const checked = selected.includes(meal.id);
          const disabled = !checked && selected.length >= 3;
          return (
            <label
              key={meal.id}
              className={`relative block overflow-hidden rounded-xl border bg-card shadow-sm transition-colors ${
                checked
                  ? "border-accent ring-2 ring-accent"
                  : "border-card-border hover:border-accent"
              } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <input
                type="checkbox"
                name="meal_id"
                value={meal.id}
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(meal.id)}
                className="sr-only"
              />
              {meal.image_url ? (
                <MealImage
                  src={meal.image_url}
                  alt=""
                  className="h-44 w-full object-cover sm:h-48"
                />
              ) : (
                <div className="flex h-44 w-full items-center justify-center bg-neutral-100 sm:h-48">
                  <UtensilsCrossed className="h-10 w-10 text-neutral-300" />
                </div>
              )}
              {checked && (
                <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white shadow">
                  <Check className="h-4 w-4" />
                </span>
              )}
              <p className="px-4 py-3 text-base font-medium text-neutral-900">
                {meal.name}
              </p>
            </label>
          );
        })}
      </div>

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
