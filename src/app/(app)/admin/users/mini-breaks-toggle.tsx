"use client";

import { useSave } from "@/lib/client/save";
import { setMiniBreaksAccess } from "./actions";
import { PROFILE_KEYS, setFlagInCache } from "./data";

export function MiniBreaksToggle({
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
        void save(() => setMiniBreaksAccess(userId, !hasAccess), {
          keys: PROFILE_KEYS,
          optimistic: (qc) => setFlagInCache(qc, userId, "has_mini_breaks_access", !hasAccess),
        })
      }
      className="text-sm text-neutral-500 underline hover:text-neutral-900 disabled:opacity-30"
    >
      {hasAccess ? "Remove mini breaks access" : "Give mini breaks access"}
    </button>
  );
}
