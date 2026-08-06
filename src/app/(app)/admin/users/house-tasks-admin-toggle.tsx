"use client";

import { useTransition } from "react";
import { setHouseTasksAdmin } from "./actions";

export function HouseTasksAdminToggle({
  userId,
  isAdmin,
}: {
  userId: string;
  isAdmin: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => setHouseTasksAdmin(userId, !isAdmin))}
      className="text-sm text-neutral-500 underline hover:text-neutral-900 disabled:opacity-30"
    >
      {isAdmin ? "Remove tasks admin" : "Make tasks admin"}
    </button>
  );
}
