"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSave } from "@/lib/client/save";
import { KioskModal } from "@/components/kiosk-modal";
import { KIOSK_BUTTON_PRIMARY, KIOSK_BUTTON_SECONDARY } from "../../../kiosk-styles";
import { removeWatchItem, WATCH_KEYS } from "../../data";
import { deleteWatchListItem } from "./actions";

export function DeleteItemButton({
  itemId,
  isKiosk,
}: {
  itemId: string;
  isKiosk?: boolean;
}) {
  const save = useSave();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Back to the list straight away with the item already gone from it; the
  // delete runs in the background, and if the server refuses it the item
  // reappears with a toast explaining why.
  function doDelete() {
    void save(() => deleteWatchListItem(itemId), {
      keys: [...WATCH_KEYS],
      optimistic: (qc) => removeWatchItem(qc, itemId),
    });
    router.push("/watch-list");
  }

  if (isKiosk) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`border-2 border-red-600 text-red-600 hover:bg-red-50 ${KIOSK_BUTTON_SECONDARY}`}
        >
          Delete suggestion
        </button>
        <KioskModal open={open} onClose={() => setOpen(false)} title="Delete this suggestion?">
          <p className="text-base text-neutral-600">This can&apos;t be undone.</p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={`flex-1 border-neutral-300 text-neutral-700 hover:bg-neutral-50 ${KIOSK_BUTTON_SECONDARY}`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                doDelete();
              }}
              className={`flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 ${KIOSK_BUTTON_PRIMARY}`}
            >
              Delete
            </button>
          </div>
        </KioskModal>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (!confirm("Delete this suggestion? This can't be undone.")) return;
          doDelete();
        }}
        className="text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
      >
        Delete suggestion
      </button>
    </div>
  );
}
