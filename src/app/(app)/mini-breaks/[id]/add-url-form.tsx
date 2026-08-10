"use client";

import { useActionState } from "react";
import type { MiniBreakUrlCategory } from "@/lib/types";
import { addUrl } from "./actions";

export function AddUrlForm({
  miniBreakId,
  categories,
}: {
  miniBreakId: string;
  categories: MiniBreakUrlCategory[];
}) {
  const boundAction = addUrl.bind(null, miniBreakId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex-1">
        <label
          htmlFor="url"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Add a link
        </label>
        <input
          id="url"
          name="url"
          type="url"
          required
          placeholder="https://..."
          className="w-full min-w-[12rem] rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label
          htmlFor="category_id"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Category
        </label>
        <select
          id="category_id"
          name="category_id"
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none"
        >
          <option value="">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent hover:bg-accent-hover px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add"}
      </button>
      {state?.error && (
        <p className="w-full text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
