"use client";

import { useState, useTransition } from "react";
import { deleteVendor, renameVendor } from "./actions";

export function VendorRow({ id, name }: { id: string; name: string }) {
  const [value, setValue] = useState(name);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dirty = value.trim() !== name && value.trim() !== "";

  return (
    <li className="px-4 py-2 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full max-w-xs rounded-md border border-neutral-300 px-2 py-1 text-sm focus:border-accent focus:outline-none"
          />
          {dirty && (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  try {
                    await renameVendor(id, value);
                  } catch (e) {
                    setError(
                      e instanceof Error ? e.message : "Failed to rename.",
                    );
                  }
                });
              }}
              className="shrink-0 rounded-md bg-accent hover:bg-accent-hover px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
            >
              Save
            </button>
          )}
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (
              confirm(
                "Delete this vendor? Only possible if it has no transactions.",
              )
            ) {
              setError(null);
              startTransition(async () => {
                try {
                  await deleteVendor(id);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Failed to delete.");
                }
              });
            }
          }}
          className="shrink-0 text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
        >
          Delete
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </li>
  );
}
