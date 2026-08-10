"use client";

import { useActionState, useState } from "react";

type ActionState = { error: string } | undefined;

type StepRow = { offset_days: string; label: string };

export function TemplateForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: {
    name?: string;
    steps?: { offset_days: number; label: string }[];
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const [steps, setSteps] = useState<StepRow[]>(
    defaultValues?.steps?.length
      ? defaultValues.steps.map((s) => ({
          offset_days: String(s.offset_days),
          label: s.label,
        }))
      : [{ offset_days: "0", label: "" }],
  );

  function updateStep(index: number, patch: Partial<StepRow>) {
    setSteps((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }
  function addStep() {
    setSteps((prev) => [...prev, { offset_days: "", label: "" }]);
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
        <div className="space-y-2">
          {steps.map((row, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
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
