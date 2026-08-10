"use client";

import { useActionState } from "react";
import type { WatchCategory } from "@/lib/types";

type ActionState = { error: string } | undefined;

export function WatchItemForm({
  action,
  platformOptions,
  defaultValues,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  platformOptions: string[];
  defaultValues?: {
    title?: string;
    category?: WatchCategory;
    platform?: string;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label
          htmlFor="title"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={defaultValues?.title}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <p className="mb-1 block text-sm font-medium text-neutral-700">
          Category
        </p>
        <div className="flex gap-4">
          <label className="flex items-center gap-1.5 text-sm text-neutral-800">
            <input
              type="radio"
              name="category"
              value="film"
              defaultChecked={(defaultValues?.category ?? "film") === "film"}
              className="h-4 w-4"
            />
            Film
          </label>
          <label className="flex items-center gap-1.5 text-sm text-neutral-800">
            <input
              type="radio"
              name="category"
              value="tv_show"
              defaultChecked={defaultValues?.category === "tv_show"}
              className="h-4 w-4"
            />
            TV Show
          </label>
        </div>
      </div>

      <div>
        <label
          htmlFor="platform"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Streaming platform
        </label>
        <input
          id="platform"
          name="platform"
          required
          list="platform-options"
          placeholder="e.g. Netflix"
          defaultValue={defaultValues?.platform}
          className="w-full max-w-xs rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
        />
        <datalist id="platform-options">
          {platformOptions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
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
