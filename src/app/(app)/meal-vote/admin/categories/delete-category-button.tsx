"use client";

import type { Category } from "@/lib/types";
import { patch, useSave } from "@/lib/client/save";
import { MEAL_CATEGORIES } from "../../data";
import { deleteCategory } from "./actions";

export function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  const save = useSave();

  return (
    <button
      type="button"
      onClick={() => {
        if (confirm("Delete this category? Meals using it will become uncategorized.")) {
          // Gone from the list at once; meals are re-synced afterwards so
          // any that used it show as uncategorized.
          void save(() => deleteCategory(categoryId), {
            keys: [MEAL_CATEGORIES, ["meals"], ["meal"]],
            optimistic: (qc) =>
              patch<Category[]>(qc, MEAL_CATEGORIES, (cats) =>
                cats.filter((c) => c.id !== categoryId),
              ),
          });
        }
      }}
      className="text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
    >
      Delete
    </button>
  );
}
