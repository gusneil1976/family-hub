"use client";

import { patch, useSave } from "@/lib/client/save";
import { SHORTLIST_KEYS, type ShortlistRow } from "../../data";
import { removeShortlistEntry } from "./actions";

export function RemoveItemButton({
  cycleId,
  entryId,
}: {
  cycleId: string;
  entryId: string;
}) {
  const save = useSave();

  // Drops off the list (and the "n of 10" count) on tap; put back with a
  // toast if the server refuses.
  function remove() {
    void save(() => removeShortlistEntry(entryId), {
      keys: [...SHORTLIST_KEYS],
      optimistic: (qc) =>
        patch<ShortlistRow[]>(qc, ["shortlist", cycleId], (rows) =>
          rows.filter((r) => r.id !== entryId),
        ),
    });
  }

  return (
    <button
      type="button"
      onClick={remove}
      className="text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
      aria-label="Remove from shortlist"
    >
      Remove
    </button>
  );
}
