"use client";

import { useSave } from "@/lib/client/save";
import { setBakingAccess } from "./actions";
import { PROFILE_KEYS, setFlagInCache } from "./data";

export function BakingToggle({
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
        void save(() => setBakingAccess(userId, !hasAccess), {
          keys: PROFILE_KEYS,
          optimistic: (qc) => setFlagInCache(qc, userId, "has_baking_access", !hasAccess),
        })
      }
      className="text-sm text-neutral-500 underline hover:text-neutral-900 disabled:opacity-30"
    >
      {hasAccess ? "Remove curing projects access" : "Give curing projects access"}
    </button>
  );
}
