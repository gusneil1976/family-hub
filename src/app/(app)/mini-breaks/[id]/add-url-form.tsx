"use client";

import type { MiniBreakUrlCategory } from "@/lib/types";
import { useSave } from "@/lib/client/save";
import { miniBreakKey, patchMiniBreakPage } from "../data";
import { addUrl } from "./actions";

export function AddUrlForm({
  miniBreakId,
  categories,
}: {
  miniBreakId: string;
  categories: MiniBreakUrlCategory[];
}) {
  const save = useSave();

  // The link appears in the list the moment it's submitted (a placeholder row
  // in the cached page) and the form clears; the re-sync afterwards swaps in
  // the real row, or the placeholder is rolled back with a toast if addUrl
  // refuses it.
  function action(formData: FormData) {
    const url = String(formData.get("url") ?? "").trim();
    if (!url) return;
    const categoryId = String(formData.get("category_id") ?? "").trim() || null;
    const category = categories.find((c) => c.id === categoryId);
    void save(() => addUrl(miniBreakId, undefined, formData), {
      keys: [miniBreakKey(miniBreakId)],
      optimistic: (qc) =>
        patchMiniBreakPage(qc, miniBreakId, (page) => ({
          ...page,
          urls: [
            ...page.urls,
            {
              id: `optimistic-${Date.now()}`,
              mini_break_id: miniBreakId,
              category_id: categoryId,
              url,
              created_at: new Date().toISOString(),
              category: category ? { name: category.name } : null,
            },
          ],
        })),
    });
  }

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
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
        className="rounded-md bg-accent hover:bg-accent-hover px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        Add
      </button>
    </form>
  );
}
