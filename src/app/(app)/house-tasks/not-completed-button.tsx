"use client";

import { useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { KioskModal } from "@/components/kiosk-modal";
import {
  KIOSK_BUTTON_PRIMARY,
  KIOSK_BUTTON_SECONDARY,
  KIOSK_ICON_BUTTON,
} from "../kiosk-styles";
import { markNotCompleted } from "./actions";

export function NotCompletedButton({
  taskId,
  isKiosk,
}: {
  taskId: string;
  isKiosk?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (isKiosk) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Not completed"
          className={`bg-red-600 hover:bg-red-700 text-white ${KIOSK_ICON_BUTTON}`}
        >
          <X className="h-7 w-7" />
        </button>
        <KioskModal open={open} onClose={() => setOpen(false)} title="Mark as not completed?">
          <p className="text-base text-neutral-600">
            This deducts its points from whoever it&apos;s assigned to.
          </p>
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
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await markNotCompleted(taskId);
                  setOpen(false);
                })
              }
              className={`flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 ${KIOSK_BUTTON_PRIMARY}`}
            >
              {pending ? "…" : "Confirm"}
            </button>
          </div>
        </KioskModal>
      </>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          confirm(
            "Mark this as not completed? This deducts its points from whoever it's assigned to.",
          )
        ) {
          startTransition(() => markNotCompleted(taskId));
        }
      }}
      aria-label="Not completed"
      title="Not completed"
      className="rounded-md bg-red-600 hover:bg-red-700 p-2 text-white disabled:opacity-50"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <X className="h-4 w-4" />
      )}
    </button>
  );
}
