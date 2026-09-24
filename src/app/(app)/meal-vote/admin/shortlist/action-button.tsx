"use client";

import { useActionState } from "react";
import { useSyncedAction } from "@/lib/client/save";
import { SHORTLIST_KEYS } from "../../data";

type ActionState = { error: string } | undefined;

export function ActionButton({
  action,
  label,
  pendingLabel,
  variant = "primary",
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  label: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary";
}) {
  // These wait for the server on purpose — the shortlist is drawn at random
  // there, so there's nothing to show until it answers. Once it does, every
  // cycle / shortlist / vote query is re-synced so the new state appears.
  const [state, formAction, pending] = useActionState(
    useSyncedAction(action, [...SHORTLIST_KEYS]),
    undefined,
  );
  const className =
    variant === "primary"
      ? "rounded-md bg-accent hover:bg-accent-hover px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      : "rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50";

  return (
    <form action={formAction} className="inline-block">
      <button type="submit" disabled={pending} className={className}>
        {pending ? (pendingLabel ?? "Working…") : label}
      </button>
      {state?.error && (
        <p className="mt-1 text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
