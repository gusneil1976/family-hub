"use client";

import { useSave } from "@/lib/client/save";
import { setArchived } from "./actions";
import { PROFILE_KEYS, setFlagInCache } from "./data";

export function ArchiveToggle({
  userId,
  isArchived,
}: {
  userId: string;
  isArchived: boolean;
}) {
  const save = useSave();

  return (
    <button
      type="button"
      onClick={() =>
        void save(() => setArchived(userId, !isArchived), {
          keys: PROFILE_KEYS,
          optimistic: (qc) => setFlagInCache(qc, userId, "is_archived", !isArchived),
        })
      }
      className="text-sm text-neutral-500 underline hover:text-neutral-900 disabled:opacity-30"
    >
      {isArchived ? "Unarchive" : "Archive"}
    </button>
  );
}
