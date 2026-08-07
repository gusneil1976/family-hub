export type PaletteKey = "terracotta" | "pink-blue" | "ocean";

export type Palette = {
  label: string;
  vars: Record<string, string>;
};

export const PALETTES: Record<PaletteKey, Palette> = {
  terracotta: {
    label: "Terracotta",
    vars: {
      "--background": "#faf6f2",
      "--accent": "#d97757",
      "--accent-hover": "#c2653f",
      "--accent-foreground": "#ffffff",
      "--accent-soft": "#fbe9e2",
      "--accent-soft-foreground": "#9a4a2e",
      "--sidebar": "#1c1917",
      "--sidebar-foreground": "#e7e5e4",
      "--sidebar-muted": "#a8a29e",
      "--card": "#ffffff",
      "--card-border": "#e7e2dc",
    },
  },
  "pink-blue": {
    label: "Pink & Blue",
    vars: {
      "--background": "#fdf2f8",
      "--accent": "#ec4899",
      "--accent-hover": "#db2777",
      "--accent-foreground": "#ffffff",
      "--accent-soft": "#fce7f3",
      "--accent-soft-foreground": "#9d174d",
      "--sidebar": "#1e1b4b",
      "--sidebar-foreground": "#e0e7ff",
      "--sidebar-muted": "#a5b4fc",
      "--card": "#ffffff",
      "--card-border": "#f0d9ea",
    },
  },
  ocean: {
    label: "Ocean Blue",
    vars: {
      "--background": "#f0f6fc",
      "--accent": "#2563eb",
      "--accent-hover": "#1d4ed8",
      "--accent-foreground": "#ffffff",
      "--accent-soft": "#dbeafe",
      "--accent-soft-foreground": "#1e40af",
      "--sidebar": "#0c1a2e",
      "--sidebar-foreground": "#dbeafe",
      "--sidebar-muted": "#93c5fd",
      "--card": "#ffffff",
      "--card-border": "#dbe7f3",
    },
  },
};

export const DEFAULT_PALETTE: PaletteKey = "terracotta";

export function resolvePalette(key: string | null | undefined): Palette {
  if (key && key in PALETTES) return PALETTES[key as PaletteKey];
  return PALETTES[DEFAULT_PALETTE];
}
