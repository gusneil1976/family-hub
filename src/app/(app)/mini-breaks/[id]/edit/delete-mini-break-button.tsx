"use client";

import { useRouter } from "next/navigation";
import { useSave } from "@/lib/client/save";
import { MINI_BREAKS, removeMiniBreak } from "../../data";
import { deleteMiniBreak } from "./actions";

export function DeleteMiniBreakButton({ miniBreakId }: { miniBreakId: string }) {
  const save = useSave();
  const router = useRouter();

  // Back to the list straight away with the mini break already gone from it;
  // the delete (files included) runs in the background, and if the server
  // refuses it the mini break reappears with a toast explaining why.
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (
            !confirm(
              "Delete this mini break? Its links and uploaded files will be deleted too. This can't be undone.",
            )
          )
            return;
          void save(() => deleteMiniBreak(miniBreakId), {
            keys: [MINI_BREAKS],
            optimistic: (qc) => removeMiniBreak(qc, miniBreakId),
          });
          router.push("/mini-breaks");
        }}
        className="text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
      >
        Delete mini break
      </button>
    </div>
  );
}
