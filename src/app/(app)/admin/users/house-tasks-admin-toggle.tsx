"use client";

import { useSave } from "@/lib/client/save";
import { setHouseTasksAdmin } from "./actions";
import { PROFILE_KEYS, setFlagInCache } from "./data";

export function HouseTasksAdminToggle({
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
        void save(() => setHouseTasksAdmin(userId, !isAdmin), {
          keys: PROFILE_KEYS,
          optimistic: (qc) => setFlagInCache(qc, userId, "is_house_tasks_admin", !isAdmin),
        })
      }
      className="text-sm text-neutral-500 underline hover:text-neutral-900 disabled:opacity-30"
    >
      {isAdmin ? "Remove tasks admin" : "Make tasks admin"}
    </button>
  );
}
