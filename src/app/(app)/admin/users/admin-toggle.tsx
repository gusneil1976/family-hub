"use client";

import { useSave } from "@/lib/client/save";
import { setAdmin } from "./actions";
import { PROFILE_KEYS, setFlagInCache } from "./data";

export function AdminToggle({
  userId,
  isAdmin,
}: {
  userId: string;
  isAdmin: boolean;
}) {
  const save = useSave();

  return (
    <button
      type="button"
      onClick={() =>
        void save(() => setAdmin(userId, !isAdmin), {
          keys: PROFILE_KEYS,
          optimistic: (qc) => setFlagInCache(qc, userId, "is_admin", !isAdmin),
        })
      }
      className="text-sm text-neutral-500 underline hover:text-neutral-900 disabled:opacity-30"
    >
      {isAdmin ? "Remove admin" : "Make admin"}
    </button>
  );
}
