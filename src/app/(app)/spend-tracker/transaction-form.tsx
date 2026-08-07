"use client";

import { useActionState } from "react";
import type { SpendCategory } from "@/lib/types";

export type TransactionFormState = { error: string } | undefined;

export function TransactionForm({
  action,
  categories,
  vendorNames,
  spentByOptions,
  defaultValues,
  submitLabel,
}: {
  action: (
    state: TransactionFormState,
    formData: FormData,
  ) => Promise<TransactionFormState>;
  categories: SpendCategory[];
  vendorNames: string[];
  spentByOptions?: { id: string; display_name: string | null }[];
  defaultValues?: {
    date?: string;
    vendor?: string;
    amount?: number;
    category_id?: string | null;
    spent_by?: string;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <div>
          <label
            htmlFor="date"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={defaultValues?.date ?? today}
            className="rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="amount"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Amount (£)
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={defaultValues?.amount ?? ""}
            className="w-32 rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="vendor"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Vendor
        </label>
        <input
          id="vendor"
          name="vendor"
          required
          list="vendor-options"
          defaultValue={defaultValues?.vendor ?? ""}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
        />
        <datalist id="vendor-options">
          {vendorNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <p className="mt-1 text-xs text-neutral-500">
          New name? It&apos;ll be added automatically.
        </p>
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
          defaultValue={defaultValues?.category_id ?? ""}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-base focus:border-accent focus:outline-none"
        >
          <option value="">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {categories.length === 0 && (
          <p className="mt-1 text-xs text-neutral-500">
            No categories yet — you can add some from the Categories page.
          </p>
        )}
      </div>

      {spentByOptions && (
        <div>
          <label
            htmlFor="spent_by"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Spent by
          </label>
          <select
            id="spent_by"
            name="spent_by"
            defaultValue={defaultValues?.spent_by}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-base focus:border-accent focus:outline-none"
          >
            {spentByOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name}
              </option>
            ))}
          </select>
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
