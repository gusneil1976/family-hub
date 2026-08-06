"use client";

import { useState, useTransition } from "react";
import { removeFamilyMember } from "./actions";

export function RemoveButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (
            !confirm("Permanently remove this person? This can't be undone.")
          ) {
            return;
          }
          setError(null);
          startTransition(async () => {
            try {
              await removeFamilyMember(userId);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed to remove.");
            }
          });
        }}
        className="text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
      >
        Remove
      </button>
      {error && <p className="mt-1 max-w-[16rem] text-xs text-red-600">{error}</p>}
    </div>
  );
}
