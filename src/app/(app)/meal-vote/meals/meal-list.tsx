"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Meal } from "@/lib/types";
import { MealImage } from "./meal-image";

export type MealRow = Meal & { categories: { name: string } | null };

const UNCATEGORIZED = "Uncategorized";

export function MealList({ meals }: { meals: MealRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return meals;
    return meals.filter((meal) => meal.name.toLowerCase().includes(q));
  }, [meals, query]);

  const groups = useMemo(() => {
    const byCategory = new Map<string, MealRow[]>();
    for (const meal of filtered) {
      const key = meal.categories?.name ?? UNCATEGORIZED;
      const existing = byCategory.get(key);
      if (existing) {
        existing.push(meal);
      } else {
        byCategory.set(key, [meal]);
      }
    }
    return [...byCategory.entries()].sort(([a], [b]) => {
      if (a === UNCATEGORIZED) return 1;
      if (b === UNCATEGORIZED) return -1;
      return a.localeCompare(b);
    });
  }, [filtered]);

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search meals…"
        className="mb-4 w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
      />

      {filtered.length === 0 && (
        <p className="text-sm text-neutral-500">
          No meals match &quot;{query}&quot;.
        </p>
      )}

      <div className="space-y-6">
        {groups.map(([categoryName, categoryMeals]) => (
          <section key={categoryName}>
            <h2 className="mb-2 text-sm font-semibold text-neutral-700">
              {categoryName}
            </h2>
            <ul className="divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
              {categoryMeals.map((meal) => (
                <li key={meal.id}>
                  <Link
                    href={`/meal-vote/meals/${meal.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50"
                  >
                    {meal.image_url ? (
                      <MealImage
                        src={meal.image_url}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <span className="h-10 w-10 shrink-0 rounded-md bg-neutral-100" />
                    )}
                    <span>
                      <span className="font-medium text-neutral-900">
                        {meal.name}
                      </span>
                      {meal.servings && (
                        <span className="ml-2 text-sm text-neutral-500">
                          Serves {meal.servings}
                        </span>
                      )}
                      {meal.excluded_from_voting && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Not in voting
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
