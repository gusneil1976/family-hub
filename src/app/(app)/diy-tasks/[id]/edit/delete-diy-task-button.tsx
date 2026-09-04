"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { KioskModal } from "@/components/kiosk-modal";
import { KIOSK_BUTTON_PRIMARY, KIOSK_BUTTON_SECONDARY } from "../../../kiosk-styles";
import { deleteDiyTask } from "./actions";

export function DeleteDiyTaskButton({
  taskId,
  isKiosk,
}: {
  taskId: string;
  isKiosk?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function doDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteDiyTask(taskId);
        router.push("/diy-tasks");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete.");
      }
    });
  }

  if (isKiosk) {
    return (
      <div>
        <button
          type="button"
          disabled={pending}
          onClick={() => setOpen(true)}
          className={`border-2 border-red-600 text-red-600 hover:bg-red-50 ${KIOSK_BUTTON_SECONDARY}`}
        >
          Delete task
        </button>
        <KioskModal open={open} onClose={() => setOpen(false)} title="Delete this DIY task?">
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
              disabled={pending}
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
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm("Delete this DIY task? This can't be undone.")) return;
          doDelete();
        }}
        className="text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
      >
        Delete task
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
