"use client";

import type { MiniBreakUrlCategory } from "@/lib/types";
import { patch, useSave } from "@/lib/client/save";
import { CATEGORIES } from "../data";
import { addCategory } from "./actions";

export function CategoryForm() {
  const save = useSave();

  // The category appears in the list (in name order) as soon as it's added
  // and the box clears; if addCategory refuses it (e.g. it already exists)
  // it's taken back out and a toast says why.
  function action(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;
    void save(() => addCategory(undefined, formData), {
      keys: [CATEGORIES],
      optimistic: (qc) =>
        patch<MiniBreakUrlCategory[]>(qc, CATEGORIES, (all) =>
          [
            ...all,
            { id: `optimistic-${Date.now()}`, name, created_at: new Date().toISOString() },
          ].sort((a, b) => a.name.localeCompare(b.name)),
        ),
    });
  }

  return (
    <form action={action} className="flex items-end gap-2">
      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          New URL category
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="e.g. Transport"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-accent hover:bg-accent-hover px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        Add
      </button>
    </form>
  );
}
