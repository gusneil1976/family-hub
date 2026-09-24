"use client";

import { useSave } from "@/lib/client/save";
import { miniBreakKey, patchMiniBreakPage } from "../data";
import { deleteUrl } from "./actions";

// The link disappears on tap; it comes back with a toast if the delete fails.
export function DeleteUrlButton({
  miniBreakId,
  urlId,
}: {
  miniBreakId: string;
  urlId: string;
}) {
  const save = useSave();

  return (
    <button
      type="button"
      onClick={() =>
        void save(() => deleteUrl(miniBreakId, urlId), {
          keys: [miniBreakKey(miniBreakId)],
          optimistic: (qc) =>
            patchMiniBreakPage(qc, miniBreakId, (page) => ({
              ...page,
              urls: page.urls.filter((u) => u.id !== urlId),
            })),
        })
      }
      className="text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
    >
      Remove
    </button>
  );
}
