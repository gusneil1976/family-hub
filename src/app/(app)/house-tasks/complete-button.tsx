"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useSave } from "@/lib/client/save";
import type { Profile } from "@/lib/types";
import { KioskModal } from "@/components/kiosk-modal";
import { WhoPicker } from "@/components/who-picker";
import {
  KIOSK_BUTTON_PRIMARY,
  KIOSK_BUTTON_SECONDARY,
  KIOSK_ICON_BUTTON,
} from "../kiosk-styles";
import { completeTask } from "./actions";
import { closeOutTaskInCache, TASK_KEYS } from "./data";

export function CompleteButton({
  taskId,
  kioskProfiles,
}: {
  taskId: string;
  kioskProfiles?: Profile[];
}) {
  const save = useSave();
  const [open, setOpen] = useState(false);
  const [who, setWho] = useState("");

  // The row leaves the list (or jumps to its next due date) immediately; the
  // save carries on in the background and is undone if the server refuses it.
  function complete(performedBy?: string) {
    void save(() => completeTask(taskId, performedBy), {
      keys: [...TASK_KEYS],
      optimistic: (qc) => closeOutTaskInCache(qc, taskId),
    });
  }

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
          className={`bg-green-600 hover:bg-green-700 text-white ${KIOSK_ICON_BUTTON}`}
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
              disabled={!who}
              onClick={() => {
                complete(who);
                close();
              }}
              className={`flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 ${KIOSK_BUTTON_PRIMARY}`}
            >
              Confirm
            </button>
          </div>
        </KioskModal>
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={() => complete()}
      aria-label="Complete"
      title="Complete"
      className="rounded-md bg-green-600 hover:bg-green-700 p-2 text-white disabled:opacity-50"
    >
      <Check className="h-4 w-4" />
    </button>
  );
}
