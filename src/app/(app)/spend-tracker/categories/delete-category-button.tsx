"use client";

import { useTransition } from "react";
import { deleteCategory } from "./actions";

export function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          confirm(
            "Delete this category? Transactions using it will become uncategorized.",
          )
        ) {
          startTransition(() => {
            deleteCategory(categoryId);
          });
        }
      }}
      className="text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
    >
      Delete
    </button>
  );
}
