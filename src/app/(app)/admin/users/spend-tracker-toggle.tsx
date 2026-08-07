"use client";

import { useTransition } from "react";
import { setSpendTrackerAccess } from "./actions";

export function SpendTrackerToggle({
  userId,
  hasAccess,
}: {
  userId: string;
  hasAccess: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(() => setSpendTrackerAccess(userId, !hasAccess))
      }
      className="text-sm text-neutral-500 underline hover:text-neutral-900 disabled:opacity-30"
    >
      {hasAccess ? "Remove spend tracker access" : "Give spend tracker access"}
    </button>
  );
}
