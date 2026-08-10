"use client";

import { useTransition } from "react";
import { deleteUrl } from "./actions";

export function DeleteUrlButton({
  miniBreakId,
  urlId,
}: {
  miniBreakId: string;
  urlId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => deleteUrl(miniBreakId, urlId))}
      className="text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
    >
      Remove
    </button>
  );
}
