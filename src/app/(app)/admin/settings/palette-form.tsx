"use client";

import { useState, useTransition } from "react";
import { PALETTES, type PaletteKey } from "@/lib/palettes";
import { setColorPalette } from "./actions";

export function PaletteForm({ current }: { current: PaletteKey }) {
  const [selected, setSelected] = useState(current);
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {(Object.entries(PALETTES) as [PaletteKey, (typeof PALETTES)[PaletteKey]][]).map(
        ([key, palette]) => {
          const isSelected = key === selected;
          return (
            <button
              key={key}
              type="button"
              disabled={pending}
              onClick={() => {
                setSelected(key);
                startTransition(() => setColorPalette(key));
              }}
              className="rounded-xl border-2 p-4 text-left transition-colors disabled:opacity-60"
              style={{
                borderColor: isSelected ? palette.vars["--accent"] : "var(--card-border)",
                background: palette.vars["--background"],
              }}
            >
              <div className="mb-3 flex gap-2">
                <span
                  className="h-8 w-8 rounded-full border border-black/10"
                  style={{ background: palette.vars["--accent"] }}
                />
                <span
                  className="h-8 w-8 rounded-full border border-black/10"
                  style={{ background: palette.vars["--sidebar"] }}
                />
              </div>
              <p className="font-medium" style={{ color: "#1c1917" }}>
                {palette.label}
              </p>
              {isSelected && (
                <p className="mt-1 text-xs text-neutral-500">
                  {pending ? "Applying…" : "Current"}
                </p>
              )}
            </button>
          );
        },
      )}
    </div>
  );
}
