"use client";

import { useTransition } from "react";
import { setArchived } from "./actions";

export function ArchiveToggle({
  userId,
  isArchived,
}: {
  userId: string;
  isArchived: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => setArchived(userId, !isArchived))}
      className="text-sm text-neutral-500 underline hover:text-neutral-900 disabled:opacity-30"
    >
      {isArchived ? "Unarchive" : "Archive"}
    </button>
  );
}
