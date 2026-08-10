"use client";

import { useActionState } from "react";
import { addCategory } from "./actions";

export function CategoryForm() {
  const [state, formAction, pending] = useActionState(addCategory, undefined);

  return (
    <form action={formAction} className="flex items-end gap-2">
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
        disabled={pending}
        className="rounded-md bg-accent hover:bg-accent-hover px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add"}
      </button>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
