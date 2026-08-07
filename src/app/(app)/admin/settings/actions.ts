"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import type { PaletteKey } from "@/lib/palettes";

export async function setColorPalette(palette: PaletteKey) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("hub_settings")
    .update({ color_palette: palette, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) {
    throw new Error(error.message);
  }

  // The palette is applied in the root layout, which wraps every route
  // (including /login) — revalidate it so the new colours show up
  // immediately everywhere, not just after a hard refresh.
  revalidatePath("/", "layout");
}
