"use client";

import { useState, useTransition } from "react";
import type { Profile } from "@/lib/types";
import { completeTask } from "./actions";

export function CompleteButton({
  taskId,
  kioskProfiles,
}: {
  taskId: string;
  kioskProfiles?: Profile[];
}) {
  const [pending, startTransition] = useTransition();
  const [picking, setPicking] = useState(false);
  const [who, setWho] = useState("");

  if (kioskProfiles) {
    if (!picking) {
      return (
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="rounded-md bg-accent hover:bg-accent-hover px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Complete
        </button>
      );
    }

    return (
      <div className="flex items-center gap-1.5">
        <select
          value={who}
          onChange={(e) => setWho(e.target.value)}
          className="rounded-md border border-neutral-300 px-2 py-1 text-sm focus:border-accent focus:outline-none"
        >
          <option value="" disabled>
            Who?
          </option>
          {kioskProfiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.display_name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending || !who}
          onClick={() =>
            startTransition(async () => {
              await completeTask(taskId, who);
              setPicking(false);
              setWho("");
            })
          }
          className="rounded-md bg-accent hover:bg-accent-hover px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => {
            setPicking(false);
            setWho("");
          }}
          aria-label="Cancel"
          className="rounded-md px-2 py-1.5 text-sm text-neutral-400 hover:text-neutral-700"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => completeTask(taskId))}
      className="rounded-md bg-accent hover:bg-accent-hover px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
    >
      {pending ? "Saving…" : "Complete"}
    </button>
  );
}
