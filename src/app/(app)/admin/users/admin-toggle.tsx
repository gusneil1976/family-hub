"use client";

import { useTransition } from "react";
import { setAdmin } from "./actions";

export function AdminToggle({
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
      onClick={() => startTransition(() => setAdmin(userId, !isAdmin))}
      className="text-sm text-neutral-500 underline hover:text-neutral-900 disabled:opacity-30"
    >
      {isAdmin ? "Remove admin" : "Make admin"}
    </button>
  );
}
