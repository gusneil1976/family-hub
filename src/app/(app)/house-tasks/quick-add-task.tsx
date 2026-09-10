"use client";

import { useRef } from "react";

// Presentational only — TasksWithQuickAdd owns the actual submit action
// (composed with an optimistic list update) so the new task can appear in
// the list immediately, rather than this component waiting on createTask's
// round trip itself.
//
// Submission is handled by hand (preventDefault + reading FormData
// ourselves) rather than the form's native `action` prop, specifically so
// the input can be cleared right away without it: resetting the form
// before React gets around to capturing its FormData for a native action
// submission sends an empty title through instead of what was typed —
// capturing the FormData ourselves first guarantees the order.
export function QuickAddTask({
  action,
  error,
}: {
  action: (formData: FormData) => void;
  error?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        e.currentTarget.reset();
        action(formData);
      }}
      className="mb-4 flex items-start gap-2"
    >
      <div className="flex-1">
        {/* Starts at 0 points rather than the full form's default of 1, so
            it doesn't need approving — see task-form.tsx for how points get
            set (and approval triggered) once a real value is picked. */}
        <input type="hidden" name="points" value="0" />
        <input
          name="title"
          required
          placeholder="Quick add a task…"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <button
        type="submit"
        className="rounded-md border border-accent px-3 py-2 text-sm font-medium text-accent hover:bg-accent hover:text-accent-foreground"
      >
        Add
      </button>
    </form>
  );
}
