"use client";

import { useState } from "react";
import type { Vendor } from "@/lib/types";
import { patch, useSave } from "@/lib/client/save";
import { VENDORS } from "../data";
import { deleteVendor, renameVendor } from "./actions";

export function VendorRow({ id, name }: { id: string; name: string }) {
  const save = useSave();
  const [value, setValue] = useState(name);
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
              onClick={() => {
                const trimmed = value.trim();
                // Renamed on screen at once (kept in name order); transaction
                // lists pick the new name up on the re-sync. A clash with an
                // existing name is undone with an error toast.
                void save(() => renameVendor(id, value), {
                  keys: [[...VENDORS], ["transactions"]],
                  optimistic: (qc) =>
                    patch<Vendor[]>(qc, VENDORS, (vendors) =>
                      vendors
                        .map((v) => (v.id === id ? { ...v, name: trimmed } : v))
                        .sort((a, b) => a.name.localeCompare(b.name)),
                    ),
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
          onClick={() => {
            if (
              confirm(
                "Delete this vendor? Only possible if it has no transactions.",
              )
            ) {
              // Removed straight away; if it still has transactions the
              // server refuses and the row comes back with an error toast.
              void save(() => deleteVendor(id), {
                keys: [[...VENDORS]],
                optimistic: (qc) =>
                  patch<Vendor[]>(qc, VENDORS, (vendors) =>
                    vendors.filter((v) => v.id !== id),
                  ),
              });
            }
          }}
          className="shrink-0 text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
        >
          Delete
        </button>
      </div>
    </li>
  );
}
