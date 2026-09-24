"use client";

// Browser-side read of the hub-wide settings row (cached by TanStack Query).
// The root layout still reads the palette itself on the server to apply it.

import { useQuery } from "@tanstack/react-query";
import { must, sb } from "@/lib/client/supabase";
import { PALETTES, DEFAULT_PALETTE, type PaletteKey } from "@/lib/palettes";

export const HUB_SETTINGS = ["hub-settings"] as const;

export type HubSettings = { color_palette: PaletteKey };

export function useHubSettings() {
  return useQuery<HubSettings>({
    queryKey: HUB_SETTINGS,
    queryFn: async () => {
      const data = must(
        await sb()
          .from("hub_settings")
          .select("color_palette")
          .eq("id", 1)
          .maybeSingle<{ color_palette: string | null }>(),
      );
      return {
        color_palette:
          data?.color_palette && data.color_palette in PALETTES
            ? (data.color_palette as PaletteKey)
            : DEFAULT_PALETTE,
      };
    },
  });
}
