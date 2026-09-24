"use client";

import { useSave } from "@/lib/client/save";
import { setShoppingListAccess } from "./actions";
import { PROFILE_KEYS, setFlagInCache } from "./data";

export function ShoppingListToggle({
  userId,
  hasAccess,
}: {
  userId: string;
  hasAccess: boolean;
}) {
  const save = useSave();

  return (
    <button
      type="button"
      onClick={() =>
        void save(() => setShoppingListAccess(userId, !hasAccess), {
          keys: PROFILE_KEYS,
          optimistic: (qc) => setFlagInCache(qc, userId, "has_shopping_list_access", !hasAccess),
        })
      }
      className="text-sm text-neutral-500 underline hover:text-neutral-900 disabled:opacity-30"
    >
      {hasAccess ? "Remove shopping list access" : "Give shopping list access"}
    </button>
  );
}
