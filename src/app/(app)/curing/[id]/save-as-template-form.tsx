"use client";

import { useActionState } from "react";
import { saveAsTemplate } from "./actions";

type ActionState = { error: string } | undefined;

export function SaveAsTemplateForm({ projectId }: { projectId: string }) {
  const boundAction = saveAsTemplate.bind(null, projectId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    boundAction,
    undefined,
  );

  return (
    <details className="rounded-xl border border-dashed border-neutral-300 p-3">
      <summary className="cursor-pointer select-none text-sm font-medium text-neutral-700">
        Save current steps as a new template
      </summary>
      <form action={formAction} className="mt-3 flex flex-wrap items-end gap-2">
        <div className="flex-1">
          <label
            htmlFor="template_name"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Template name
          </label>
          <input
            id="template_name"
            name="name"
            required
            placeholder="e.g. Salami — 8 week cure"
            className="w-full min-w-[10rem] rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent hover:bg-accent-hover px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save as template"}
        </button>
        {state?.error && (
          <p className="w-full text-sm text-red-600">{state.error}</p>
        )}
      </form>
      <p className="mt-2 text-xs text-neutral-500">
        Each step&apos;s day offset is captured relative to this
        project&apos;s start date.
      </p>
    </details>
  );
}
