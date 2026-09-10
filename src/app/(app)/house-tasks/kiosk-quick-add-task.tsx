"use client";

import { useRef } from "react";
import type { Profile } from "@/lib/types";
import { WhoPicker } from "@/components/who-picker";
import { KIOSK_BUTTON_PRIMARY } from "../kiosk-styles";

// Kiosk's version of the desktop quick-add box (quick-add-task.tsx) — same
// idea, title-only fast entry, everything else (recurrence, due date,
// allocation) filled in later via Edit — but needs a "who's adding this"
// picker, since the shared kiosk login has no personal identity of its own
// for createTask to credit it to, and kiosk-sized touch targets throughout.
//
// Presentational only, same as the desktop version — KioskTasksWithQuickAdd
// owns the actual submit action (composed with an optimistic update to the
// right person's list) so the new task can appear immediately instead of
// waiting on createTask's real round trip. Submission is handled by hand
// (preventDefault + reading FormData ourselves) so the title can be
// cleared right away without racing React's own capture of it for the
// action — see quick-add-task.tsx for why that matters. The picked person
// deliberately isn't cleared: a run of quick-adds is usually all the same
// person, so leaving it selected saves a re-tap each time.
export function KioskQuickAddTask({
  profiles,
  action,
  error,
}: {
  profiles: Profile[];
  action: (formData: FormData) => void;
  error?: string;
}) {
  const titleRef = useRef<HTMLInputElement>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        if (titleRef.current) titleRef.current.value = "";
        action(formData);
      }}
      className="mb-6 space-y-4"
    >
      <WhoPicker profiles={profiles} label="Who's adding this?" />
      <div>
        {/* Starts at 0 points rather than the full form's default of 1, so
            it doesn't need approving — see task-form.tsx for how points get
            set (and approval triggered) once a real value is picked. */}
        <input type="hidden" name="points" value="0" />
        <input
          ref={titleRef}
          name="title"
          required
          placeholder="Quick add a task…"
          className="w-full rounded-xl border-2 border-neutral-300 px-4 py-3 text-lg focus:border-accent focus:outline-none"
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
      <button
        type="submit"
        className={`border-2 border-accent bg-accent text-accent-foreground hover:bg-accent-hover ${KIOSK_BUTTON_PRIMARY}`}
      >
        Add
      </button>
    </form>
  );
}
