"use client";

import { useActionState } from "react";
import { uploadFile } from "./actions";

export function AddFileForm({ miniBreakId }: { miniBreakId: string }) {
  const boundAction = uploadFile.bind(null, miniBreakId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  return (
    <form action={formAction} className="space-y-2">
      <div>
        <label
          htmlFor="file"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Upload a JPG (e.g. a ticket screenshot)
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept="image/jpeg"
          required
          className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded-md file:border file:border-neutral-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-50"
        />
      </div>
      <div>
        <label
          htmlFor="description"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          What is this?
        </label>
        <input
          id="description"
          name="description"
          placeholder="e.g. Outbound flight confirmation"
          className="w-full max-w-md rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent hover:bg-accent-hover px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Uploading…" : "Upload"}
      </button>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
