"use client";

import { useTransition } from "react";
import { setKioskMode } from "./actions";

export function KioskToggle({
  userId,
  isKiosk,
}: {
  userId: string;
  isKiosk: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => setKioskMode(userId, !isKiosk))}
      className="text-sm text-neutral-500 underline hover:text-neutral-900 disabled:opacity-30"
    >
      {isKiosk ? "Remove kiosk mode" : "Make kiosk"}
    </button>
  );
}
