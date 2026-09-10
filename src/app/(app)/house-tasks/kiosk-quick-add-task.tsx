"use client";

import { useActionState } from "react";
import type { Profile } from "@/lib/types";
import { WhoPicker } from "@/components/who-picker";
import { createTask } from "./new/actions";
import { KIOSK_BUTTON_PRIMARY } from "../kiosk-styles";

// Kiosk's version of the desktop quick-add box (quick-add-task.tsx) — same
// idea, title-only fast entry, everything else (recurrence, due date,
// allocation) filled in later via Edit — but needs a "who's adding this"
// picker, since the shared kiosk login has no personal identity of its own
// for createTask to credit it to, and kiosk-sized touch targets throughout.
// Simpler than the desktop version too: no optimistic instant-add, since
// that was built around the desktop page's plain myTasks/otherTasks split,
// not kiosk's per-person grouping.
export function KioskQuickAddTask({ profiles }: { profiles: Profile[] }) {
  const [state, formAction, pending] = useActionState(createTask, undefined);

  return (
    <form action={formAction} className="mb-6 space-y-4">
      <WhoPicker profiles={profiles} label="Who's adding this?" />
      <div>
        <input
          name="title"
          required
          placeholder="Quick add a task…"
          className="w-full rounded-xl border-2 border-neutral-300 px-4 py-3 text-lg focus:border-accent focus:outline-none"
        />
        {state?.error && (
          <p className="mt-1 text-sm text-red-600">{state.error}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className={`border-2 border-accent bg-accent text-accent-foreground hover:bg-accent-hover disabled:opacity-50 ${KIOSK_BUTTON_PRIMARY}`}
      >
        {pending ? "Adding…" : "Add"}
      </button>
    </form>
  );
}
