"use client";

import { useSave } from "@/lib/client/save";
import { setSpendTrackerAccess } from "./actions";
import { PROFILE_KEYS, setFlagInCache } from "./data";

export function SpendTrackerToggle({
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
        void save(() => setSpendTrackerAccess(userId, !hasAccess), {
          keys: PROFILE_KEYS,
          optimistic: (qc) => setFlagInCache(qc, userId, "has_spend_tracker_access", !hasAccess),
        })
      }
      className="text-sm text-neutral-500 underline hover:text-neutral-900 disabled:opacity-30"
    >
      {hasAccess ? "Remove spend tracker access" : "Give spend tracker access"}
    </button>
  );
}
