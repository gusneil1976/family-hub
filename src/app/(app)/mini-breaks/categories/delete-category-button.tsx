"use client";

import type { MiniBreakUrlCategory } from "@/lib/types";
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
            "Delete this category? Links using it will become uncategorized.",
          )
        ) {
          // Gone from the list on tap. Mini break pages are re-synced too,
          // since their links using it lose their category badge.
          void save(() => deleteCategory(categoryId), {
            keys: [CATEGORIES, ["mini-break"]],
            optimistic: (qc) =>
              patch<MiniBreakUrlCategory[]>(qc, CATEGORIES, (all) =>
                all.filter((c) => c.id !== categoryId),
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
