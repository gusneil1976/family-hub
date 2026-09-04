"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import type { Profile } from "@/lib/types";
import { KioskModal } from "@/components/kiosk-modal";
import { WhoPicker } from "@/components/who-picker";
import {
  KIOSK_BUTTON_PRIMARY,
  KIOSK_BUTTON_SECONDARY,
  KIOSK_ICON_BUTTON,
} from "../kiosk-styles";
import { completeTask } from "./actions";

export function CompleteButton({
  taskId,
  kioskProfiles,
}: {
  taskId: string;
  kioskProfiles?: Profile[];
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [who, setWho] = useState("");

  function close() {
    setOpen(false);
    setWho("");
  }

  if (kioskProfiles) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Complete"
          className={`bg-accent hover:bg-accent-hover text-white ${KIOSK_ICON_BUTTON}`}
        >
          <Check className="h-7 w-7" />
        </button>
        <KioskModal open={open} onClose={close} title="Who's completing this?">
          <WhoPicker profiles={kioskProfiles} label="" onChange={setWho} />
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={close}
              className={`flex-1 border-neutral-300 text-neutral-700 hover:bg-neutral-50 ${KIOSK_BUTTON_SECONDARY}`}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending || !who}
              onClick={() =>
                startTransition(async () => {
                  await completeTask(taskId, who);
                  close();
                })
              }
              className={`flex-1 bg-accent hover:bg-accent-hover text-white disabled:opacity-50 ${KIOSK_BUTTON_PRIMARY}`}
            >
              {pending ? "Saving…" : "Confirm"}
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
      onClick={() => startTransition(() => completeTask(taskId))}
      aria-label="Complete"
      title="Complete"
      className="rounded-md bg-accent hover:bg-accent-hover p-2 text-white disabled:opacity-50"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Check className="h-4 w-4" />
      )}
    </button>
  );
}
