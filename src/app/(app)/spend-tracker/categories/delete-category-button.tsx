"use client";

import type { SpendCategory } from "@/lib/types";
import { patch, useSave } from "@/lib/client/save";
import { CATEGORIES } from "../data";
import { deleteCategory } from "./actions";

export function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  const save = useSave();

  return (
    <button
      type="button"
      onClick={() => {
        if (
          confirm(
            "Delete this category? Transactions using it will become uncategorized.",
          )
        ) {
          // Gone from the list at once; transactions, budgets and the report
          // re-sync afterwards to pick up the knock-on changes.
          void save(() => deleteCategory(categoryId), {
            keys: [[...CATEGORIES], ["transactions"], ["budgets"]],
            optimistic: (qc) =>
              patch<SpendCategory[]>(qc, CATEGORIES, (cats) =>
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
