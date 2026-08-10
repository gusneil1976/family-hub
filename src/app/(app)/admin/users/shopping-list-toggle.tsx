"use client";

import { useTransition } from "react";
import { setShoppingListAccess } from "./actions";

export function ShoppingListToggle({
  userId,
  hasAccess,
}: {
  userId: string;
  hasAccess: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(() => setShoppingListAccess(userId, !hasAccess))
      }
      className="text-sm text-neutral-500 underline hover:text-neutral-900 disabled:opacity-30"
    >
      {hasAccess ? "Remove shopping list access" : "Give shopping list access"}
    </button>
  );
}
