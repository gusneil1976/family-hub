"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteMiniBreak } from "./actions";

export function DeleteMiniBreakButton({ miniBreakId }: { miniBreakId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (
            !confirm(
              "Delete this mini break? Its links and uploaded files will be deleted too. This can't be undone.",
            )
          )
            return;
          setError(null);
          startTransition(async () => {
            try {
              await deleteMiniBreak(miniBreakId);
              router.push("/mini-breaks");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed to delete.");
            }
          });
        }}
        className="text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
      >
        Delete mini break
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
