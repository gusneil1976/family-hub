"use client";

import { useSave } from "@/lib/client/save";
import { removeFamilyMember } from "./actions";
import { PROFILE_KEYS, removeProfileInCache } from "./data";

export function RemoveButton({ userId }: { userId: string }) {
  const save = useSave();

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (
            !confirm("Permanently remove this person? This can't be undone.")
          ) {
            return;
          }
          // The row goes at once; if the server refuses (e.g. they still
          // have meals or votes) it comes back and the reason is shown as a
          // toast.
          void save(() => removeFamilyMember(userId), {
            keys: PROFILE_KEYS,
            optimistic: (qc) => removeProfileInCache(qc, userId),
          });
        }}
        className="text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
      >
        Remove
      </button>
    </div>
  );
}
