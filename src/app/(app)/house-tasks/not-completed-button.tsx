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

// Marking something not completed has a nuance native confirm() can't
// express: was the moment genuinely missed (close it out — recurring tasks
// jump to their next occurrence, one-offs are done), or can someone else
// still get to it today (leave it open, unchanged)? So this always opens a
// choice, on kiosk and desktop alike, instead of a single confirm dialog.
export function NotCompletedButton({
  taskId,
  isKiosk,
}: {
  taskId: string;
  isKiosk?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function choose(close: boolean) {
    startTransition(async () => {
      await markNotCompleted(taskId, close);
      setOpen(false);
    });
  }

  const primaryBtn = isKiosk
    ? KIOSK_BUTTON_PRIMARY
    : "rounded-md px-4 py-2 text-sm font-medium";
  const secondaryBtn = isKiosk
    ? KIOSK_BUTTON_SECONDARY
    : "rounded-md border px-4 py-2 text-sm font-medium";
  const bodyText = isKiosk ? "text-base text-neutral-600" : "text-sm text-neutral-600";

  return (
    <>
      {isKiosk ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Not completed"
          className={`bg-red-600 hover:bg-red-700 text-white ${KIOSK_ICON_BUTTON}`}
        >
          <X className="h-7 w-7" />
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => setOpen(true)}
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
      )}

      <KioskModal
        open={open}
        onClose={() => setOpen(false)}
        title="Mark as not completed?"
      >
        <p className={bodyText}>
          This deducts its points from whoever it&apos;s assigned to. What
          should happen to the task?
        </p>
        <div className="mt-4 space-y-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => choose(false)}
            className={`w-full border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 ${secondaryBtn}`}
          >
            Leave it open — someone can still do it
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => choose(true)}
            className={`w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 ${primaryBtn}`}
          >
            {pending ? "…" : "Close it — the moment's passed"}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={`mt-3 w-full text-center text-neutral-500 hover:text-neutral-700 ${
            isKiosk ? "text-lg" : "text-sm"
          }`}
        >
          Cancel
        </button>
      </KioskModal>
    </>
  );
}
