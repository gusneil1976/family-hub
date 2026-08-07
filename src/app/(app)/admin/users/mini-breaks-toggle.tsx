"use client";

import { useTransition } from "react";
import { setMiniBreaksAccess } from "./actions";

export function MiniBreaksToggle({
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
        startTransition(() => setMiniBreaksAccess(userId, !hasAccess))
      }
      className="text-sm text-neutral-500 underline hover:text-neutral-900 disabled:opacity-30"
    >
      {hasAccess ? "Remove mini breaks access" : "Give mini breaks access"}
    </button>
  );
}
