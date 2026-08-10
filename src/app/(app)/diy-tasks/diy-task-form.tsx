"use client";

import { useActionState } from "react";
import type { Profile } from "@/lib/types";
import { WhoPicker } from "@/components/who-picker";

type ActionState = { error: string } | undefined;

export function DiyTaskForm({
  action,
  defaultValues,
  submitLabel,
  projectOptions,
  kioskProfiles,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: {
    title?: string;
    project?: string | null;
    notes?: string | null;
    hours_estimate?: number | null;
  };
  submitLabel: string;
  projectOptions: string[];
  kioskProfiles?: Profile[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-6">
      {kioskProfiles && !defaultValues && (
        <WhoPicker profiles={kioskProfiles} label="Who's creating this?" />
      )}

      <div>
        <label
          htmlFor="title"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Task
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={defaultValues?.title}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <label
            htmlFor="project"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Project (optional)
          </label>
          <input
            id="project"
            name="project"
            list="project-options"
            placeholder="e.g. Kitchen"
            defaultValue={defaultValues?.project ?? ""}
            className="rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
          />
          <datalist id="project-options">
            {projectOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        <div>
          <label
            htmlFor="hours_estimate"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Estimated hours (optional)
          </label>
          <input
            id="hours_estimate"
            name="hours_estimate"
            type="number"
            min={0}
            step="0.5"
            defaultValue={defaultValues?.hours_estimate ?? ""}
            className="w-32 rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="notes"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={defaultValues?.notes ?? ""}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
