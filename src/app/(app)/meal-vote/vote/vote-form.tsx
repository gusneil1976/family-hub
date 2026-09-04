"use client";

import { useActionState, useState } from "react";
import { ChevronDown, ChevronUp, UtensilsCrossed, X } from "lucide-react";
import type { Meal, Profile } from "@/lib/types";
import { WhoPicker } from "@/components/who-picker";
import { KIOSK_BUTTON_PRIMARY } from "../../kiosk-styles";
import { MealImage } from "../meals/meal-image";

type ActionState = { error: string } | undefined;

const RANK_LABELS = ["1st", "2nd", "3rd"];
const RANK_STYLES = ["bg-accent", "bg-neutral-500", "bg-amber-700"];

export function VoteForm({
  meals,
  initialSelected,
  action,
  kioskProfiles,
}: {
  meals: Meal[];
  initialSelected: string[];
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  kioskProfiles?: Profile[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const mealById = new Map(meals.map((m) => [m.id, m]));
  const isKiosk = !!kioskProfiles;

  function toggle(mealId: string) {
    setSelected((prev) =>
      prev.includes(mealId)
        ? prev.filter((id) => id !== mealId)
        : prev.length < 3
          ? [...prev, mealId]
          : prev,
    );
  }

  function move(index: number, direction: -1 | 1) {
    setSelected((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <form action={formAction}>
      {kioskProfiles && (
        <div className="mb-6">
          <WhoPicker profiles={kioskProfiles} label="Who's voting?" />
        </div>
      )}

      {selected.map((id) => (
        <input key={id} type="hidden" name="meal_id" value={id} />
      ))}

      {selected.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-sm font-medium text-neutral-700">
            Your ranking
          </p>
          <ul className="divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
            {selected.map((id, i) => (
              <li
                key={id}
                className={`flex items-center justify-between gap-3 ${
                  isKiosk ? "px-5 py-4 text-base" : "px-4 py-2.5 text-sm"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${
                      isKiosk ? "h-8 w-14 text-sm" : "h-6 w-10 text-xs"
                    } ${RANK_STYLES[i]}`}
                  >
                    {RANK_LABELS[i]}
                  </span>
                  <span
                    className={`font-medium text-neutral-900 ${isKiosk ? "text-lg" : ""}`}
                  >
                    {mealById.get(id)?.name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className={`rounded text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 ${
                      isKiosk ? "p-3" : "p-1"
                    }`}
                  >
                    <ChevronUp className={isKiosk ? "h-7 w-7" : "h-4 w-4"} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === selected.length - 1}
                    aria-label="Move down"
                    className={`rounded text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 ${
                      isKiosk ? "p-3" : "p-1"
                    }`}
                  >
                    <ChevronDown className={isKiosk ? "h-7 w-7" : "h-4 w-4"} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    aria-label="Remove"
                    className={`rounded text-neutral-500 hover:bg-neutral-100 ${
                      isKiosk ? "p-3" : "p-1"
                    }`}
                  >
                    <X className={isKiosk ? "h-7 w-7" : "h-4 w-4"} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {meals.map((meal) => {
          const rankIndex = selected.indexOf(meal.id);
          const checked = rankIndex !== -1;
          const disabled = !checked && selected.length >= 3;
          return (
            <button
              key={meal.id}
              type="button"
              onClick={() => toggle(meal.id)}
              disabled={disabled}
              className={`relative block overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-colors ${
                checked
                  ? "border-accent ring-2 ring-accent"
                  : "border-card-border hover:border-accent"
              } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
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
                <span
                  className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow ${RANK_STYLES[rankIndex]}`}
                >
                  {RANK_LABELS[rankIndex]}
                </span>
              )}
              <p className="px-4 py-3 text-base font-medium text-neutral-900">
                {meal.name}
              </p>
            </button>
          );
        })}
      </div>

      <p className="mb-2 text-sm text-neutral-500">
        {selected.length} / 3 selected — 1st choice scores 3 points, 2nd
        scores 2, 3rd scores 1.
      </p>

      {state?.error && (
        <p className="mb-2 text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending || selected.length === 0}
        className={
          isKiosk
            ? `bg-accent hover:bg-accent-hover text-white disabled:opacity-50 ${KIOSK_BUTTON_PRIMARY}`
            : "rounded-md bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        }
      >
        {pending ? "Saving…" : "Save my votes"}
      </button>
    </form>
  );
}
