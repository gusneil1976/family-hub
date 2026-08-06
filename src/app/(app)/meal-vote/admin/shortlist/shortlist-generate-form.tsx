"use client";

import { useActionState } from "react";
import type { Category } from "@/lib/types";

type ActionState = { error: string } | undefined;

export function ShortlistGenerateForm({
  action,
  categories,
  selectedIds,
  label,
  pendingLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  categories: Category[];
  selectedIds: string[];
  label: string;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction}>
      <p className="mb-2 text-sm font-medium text-neutral-700">
        Categories to include
      </p>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2">
        {categories.map((category) => (
          <label
            key={category.id}
            className="flex items-center gap-1.5 text-sm text-neutral-800"
          >
            <input
              type="checkbox"
              name="category_id"
              value={category.id}
              defaultChecked={selectedIds.includes(category.id)}
              className="h-4 w-4"
            />
            {category.name}
          </label>
        ))}
      </div>

      {state?.error && (
        <p className="mb-2 text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent hover:bg-accent-hover px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? pendingLabel : label}
      </button>
    </form>
  );
}
