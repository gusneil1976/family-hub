"use client";

import { useTransition } from "react";
import { deleteFile } from "./actions";

export function DeleteFileButton({
  miniBreakId,
  fileId,
}: {
  miniBreakId: string;
  fileId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => deleteFile(miniBreakId, fileId))}
      className="text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
    >
      Remove
    </button>
  );
}
