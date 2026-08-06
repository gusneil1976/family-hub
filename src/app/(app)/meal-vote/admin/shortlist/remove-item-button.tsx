"use client";

import { useTransition } from "react";
import { removeShortlistEntry } from "./actions";

export function RemoveItemButton({ entryId }: { entryId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => removeShortlistEntry(entryId))}
      className="text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
      aria-label="Remove from shortlist"
    >
      Remove
    </button>
  );
}
