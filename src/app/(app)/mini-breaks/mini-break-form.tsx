"use client";

import { useActionState, useRef, useState } from "react";
import type { MiniBreakUrlCategory } from "@/lib/types";

type ActionState = { error: string } | undefined;

type UrlRow = { url: string; category_id: string };

export function MiniBreakForm({
  action,
  defaultValues,
  submitLabel,
  categories,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: {
    title?: string;
    date_from?: string | null;
    date_to?: string | null;
    notes?: string | null;
  };
  submitLabel: string;
  // Only passed on the create form — when present, renders the optional
  // Links/Files sections. The edit page manages those separately on the
  // mini break's own detail page, so it omits this prop.
  categories?: MiniBreakUrlCategory[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const [urlRows, setUrlRows] = useState<UrlRow[]>([{ url: "", category_id: "" }]);
  function updateUrlRow(index: number, patch: Partial<UrlRow>) {
    setUrlRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }
  function addUrlRow() {
    setUrlRows((prev) => [...prev, { url: "", category_id: "" }]);
  }
  function removeUrlRow(index: number) {
    setUrlRows((prev) => prev.filter((_, i) => i !== index));
  }

  const [fileRowKeys, setFileRowKeys] = useState<number[]>([0]);
  const nextFileKey = useRef(1);
  function addFileRow() {
    setFileRowKeys((prev) => [...prev, nextFileKey.current++]);
  }
  function removeFileRow(key: number) {
    setFileRowKeys((prev) => prev.filter((k) => k !== key));
  }

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label
          htmlFor="title"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Where/what
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
            htmlFor="date_from"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            From (optional)
          </label>
          <input
            id="date_from"
            name="date_from"
            type="date"
            defaultValue={defaultValues?.date_from ?? ""}
            className="rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="date_to"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            To (optional)
          </label>
          <input
            id="date_to"
            name="date_to"
            type="date"
            defaultValue={defaultValues?.date_to ?? ""}
            className="rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
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

      {categories && (
        <>
          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-neutral-700">
              Links (optional)
            </legend>
            <div className="space-y-2">
              {urlRows.map((row, i) => (
                <div key={i} className="flex flex-wrap gap-2">
                  <input
                    name="url"
                    type="url"
                    placeholder="https://..."
                    value={row.url}
                    onChange={(e) => updateUrlRow(i, { url: e.target.value })}
                    className="min-w-[12rem] flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                  <select
                    name="category_id"
                    value={row.category_id}
                    onChange={(e) => updateUrlRow(i, { category_id: e.target.value })}
                    className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeUrlRow(i)}
                    disabled={urlRows.length === 1}
                    className="rounded-md px-2 text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
                    aria-label="Remove link"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addUrlRow}
              className="mt-2 text-sm font-medium text-neutral-700 hover:text-neutral-900"
            >
              + Add another link
            </button>
          </fieldset>

          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-neutral-700">
              Files (optional, JPG only)
            </legend>
            <div className="space-y-2">
              {fileRowKeys.map((key) => (
                <div key={key} className="flex flex-wrap items-center gap-2">
                  <input
                    name="file"
                    type="file"
                    accept="image/jpeg"
                    className="text-sm text-neutral-700 file:mr-3 file:rounded-md file:border file:border-neutral-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-50"
                  />
                  <input
                    name="description"
                    placeholder="What is this?"
                    className="min-w-[10rem] flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeFileRow(key)}
                    disabled={fileRowKeys.length === 1}
                    className="rounded-md px-2 text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
                    aria-label="Remove file"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addFileRow}
              className="mt-2 text-sm font-medium text-neutral-700 hover:text-neutral-900"
            >
              + Add another file
            </button>
          </fieldset>
        </>
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
