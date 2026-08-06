"use client";

import { useActionState } from "react";
import { inviteFamilyMember } from "./actions";

export function InviteForm() {
  const [state, formAction, pending] = useActionState(
    inviteFamilyMember,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div>
        <label
          htmlFor="display_name"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Name (optional)
        </label>
        <input
          id="display_name"
          name="display_name"
          placeholder="e.g. Hamish"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent hover:bg-accent-hover px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send invite"}
      </button>
      {state?.error && (
        <p className="w-full text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
