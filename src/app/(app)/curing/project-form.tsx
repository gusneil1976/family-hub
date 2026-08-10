"use client";

import { useActionState } from "react";
import type { BakingTemplate } from "@/lib/types";

type ActionState = { error: string } | undefined;

export function ProjectForm({
  action,
  defaultValues,
  submitLabel,
  templates,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: {
    name?: string;
    start_date?: string;
    initial_weight?: number | null;
    target_weight?: number | null;
  };
  submitLabel: string;
  // Only passed on the create form — importing a template only makes sense
  // at creation, so the edit form omits this and the picker doesn't render.
  templates?: BakingTemplate[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Project name
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="e.g. Truffle Salami"
          defaultValue={defaultValues?.name}
          className="w-full max-w-md rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="start_date"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Start date
        </label>
        <input
          id="start_date"
          name="start_date"
          type="date"
          required
          defaultValue={defaultValues?.start_date ?? today}
          className="rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <label
            htmlFor="initial_weight"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Initial weight (g, optional)
          </label>
          <input
            id="initial_weight"
            name="initial_weight"
            type="number"
            min={0}
            step="0.1"
            defaultValue={defaultValues?.initial_weight ?? ""}
            className="w-32 rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="target_weight"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Target weight (g, optional)
          </label>
          <input
            id="target_weight"
            name="target_weight"
            type="number"
            min={0}
            step="0.1"
            defaultValue={defaultValues?.target_weight ?? ""}
            className="w-32 rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {templates && (
        <div>
          <label
            htmlFor="template_id"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Start from a template (optional)
          </label>
          <select
            id="template_id"
            name="template_id"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-base focus:border-accent focus:outline-none"
          >
            <option value="">Blank — no steps yet</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-500">
            Imports the template&apos;s steps, dated from your start date
            above. You can still add more steps afterward.
          </p>
        </div>
      )}

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
