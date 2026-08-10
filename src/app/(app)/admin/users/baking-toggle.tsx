"use client";

import { useTransition } from "react";
import { setBakingAccess } from "./actions";

export function BakingToggle({
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
        startTransition(() => setBakingAccess(userId, !hasAccess))
      }
      className="text-sm text-neutral-500 underline hover:text-neutral-900 disabled:opacity-30"
    >
      {hasAccess ? "Remove curing projects access" : "Give curing projects access"}
    </button>
  );
}
