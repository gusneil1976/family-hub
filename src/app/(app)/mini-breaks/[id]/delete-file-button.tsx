"use client";

import { useSave } from "@/lib/client/save";
import { miniBreakKey, patchMiniBreakPage } from "../data";
import { deleteFile } from "./actions";

// The file disappears on tap; it comes back with a toast if the delete fails.
export function DeleteFileButton({
  miniBreakId,
  fileId,
}: {
  miniBreakId: string;
  fileId: string;
}) {
  const save = useSave();

  return (
    <button
      type="button"
      onClick={() =>
        void save(() => deleteFile(miniBreakId, fileId), {
          keys: [miniBreakKey(miniBreakId)],
          optimistic: (qc) =>
            patchMiniBreakPage(qc, miniBreakId, (page) => ({
              ...page,
              files: page.files.filter((f) => f.id !== fileId),
            })),
        })
      }
      className="text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
    >
      Remove
    </button>
  );
}
