"use client";

import { useActionState, useState } from "react";

type ActionState = { error: string } | undefined;

type StepRow = {
  offset_days: string;
  label: string;
  recurrence_interval_days: string;
  recurrence_count: string;
};

export function TemplateForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: {
    name?: string;
    steps?: {
      offset_days: number;
      label: string;
      recurrence_interval_days?: number | null;
      recurrence_count?: number | null;
    }[];
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const [steps, setSteps] = useState<StepRow[]>(
    defaultValues?.steps?.length
      ? defaultValues.steps.map((s) => ({
          offset_days: String(s.offset_days),
          label: s.label,
          recurrence_interval_days: s.recurrence_interval_days
            ? String(s.recurrence_interval_days)
            : "",
          recurrence_count: s.recurrence_count ? String(s.recurrence_count) : "",
        }))
      : [
          {
            offset_days: "0",
            label: "",
            recurrence_interval_days: "",
            recurrence_count: "",
          },
        ],
  );

  function updateStep(index: number, patch: Partial<StepRow>) {
    setSteps((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }
  function addStep() {
    setSteps((prev) => [
      ...prev,
      {
        offset_days: "",
        label: "",
        recurrence_interval_days: "",
        recurrence_count: "",
      },
    ]);
  }
  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Template name
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="e.g. Salami — 8 week cure"
          defaultValue={defaultValues?.name}
          className="w-full max-w-md rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
        />
      </div>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-neutral-700">
          Steps
        </legend>
        <div className="space-y-3">
          {steps.map((row, i) => (
            <div
              key={i}
              className="rounded-md border border-neutral-200 p-2.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-neutral-500">Day</span>
                <input
                  name="offset_days"
                  type="number"
                  value={row.offset_days}
                  onChange={(e) =>
                    updateStep(i, { offset_days: e.target.value })
                  }
                  className="w-20 rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
                />
                <input
                  name="label"
                  placeholder="e.g. Check weight"
                  value={row.label}
                  onChange={(e) => updateStep(i, { label: e.target.value })}
                  className="min-w-[10rem] flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeStep(i)}
                  disabled={steps.length === 1}
                  className="rounded-md px-2 text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
                  aria-label="Remove step"
                >
                  ✕
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 pl-6">
                <span className="text-xs text-neutral-500">Repeats every</span>
                <input
                  name="recurrence_interval_days"
                  type="number"
                  min={1}
                  placeholder="—"
                  value={row.recurrence_interval_days}
                  onChange={(e) =>
                    updateStep(i, { recurrence_interval_days: e.target.value })
                  }
                  className="w-16 rounded-md border border-neutral-300 px-2 py-1 text-xs focus:border-accent focus:outline-none"
                />
                <span className="text-xs text-neutral-500">days, for</span>
                <input
                  name="recurrence_count"
                  type="number"
                  min={1}
                  placeholder="∞"
                  disabled={!row.recurrence_interval_days}
                  value={row.recurrence_count}
                  onChange={(e) =>
                    updateStep(i, { recurrence_count: e.target.value })
                  }
                  className="w-16 rounded-md border border-neutral-300 px-2 py-1 text-xs focus:border-accent focus:outline-none disabled:bg-neutral-100"
                />
                <span className="text-xs text-neutral-500">
                  times (blank = until you stop it)
                </span>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addStep}
          className="mt-2 text-sm font-medium text-neutral-700 hover:text-neutral-900"
        >
          + Add another step
        </button>
      </fieldset>

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
