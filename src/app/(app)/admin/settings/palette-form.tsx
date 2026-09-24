"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { patch, useSave } from "@/lib/client/save";
import { PALETTES, type PaletteKey } from "@/lib/palettes";
import { setColorPalette } from "./actions";
import { HUB_SETTINGS, type HubSettings } from "./data";

export function PaletteForm({ current }: { current: PaletteKey }) {
  // `current` comes from the cached settings, which are patched on tap (and
  // rolled back if the save fails), so the tapped card is selected at once.
  const save = useSave();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // The colours themselves are applied by the root layout from a cached
  // server read that setColorPalette revalidates, so once it's saved the
  // page is refreshed to pick them up ("Applying…" until then).
  function choose(key: PaletteKey) {
    startTransition(async () => {
      const { ok } = await save(() => setColorPalette(key), {
        keys: [HUB_SETTINGS],
        optimistic: (qc) =>
          patch<HubSettings>(qc, HUB_SETTINGS, (s) => ({ ...s, color_palette: key })),
      });
      if (ok) router.refresh();
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {(Object.entries(PALETTES) as [PaletteKey, (typeof PALETTES)[PaletteKey]][]).map(
        ([key, palette]) => {
          const isSelected = key === current;
          return (
            <button
              key={key}
              type="button"
              disabled={pending}
              onClick={() => choose(key)}
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
