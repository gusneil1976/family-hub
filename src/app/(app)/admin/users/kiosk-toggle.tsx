"use client";

import { useSave } from "@/lib/client/save";
import { setKioskMode } from "./actions";
import { PROFILE_KEYS, setFlagInCache } from "./data";

export function KioskToggle({
  userId,
  isKiosk,
}: {
  userId: string;
  isKiosk: boolean;
}) {
  const save = useSave();

  return (
    <button
      type="button"
      onClick={() =>
        void save(() => setKioskMode(userId, !isKiosk), {
          keys: PROFILE_KEYS,
          optimistic: (qc) => setFlagInCache(qc, userId, "is_kiosk", !isKiosk),
        })
      }
      className="text-sm text-neutral-500 underline hover:text-neutral-900 disabled:opacity-30"
    >
      {isKiosk ? "Remove kiosk mode" : "Make kiosk"}
    </button>
  );
}
