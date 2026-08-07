import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { PALETTES, DEFAULT_PALETTE, type PaletteKey } from "@/lib/palettes";
import { PaletteForm } from "./palette-form";

export default async function AppearanceSettingsPage() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("hub_settings")
    .select("color_palette")
    .eq("id", 1)
    .single();

  const currentKey: PaletteKey =
    data?.color_palette && data.color_palette in PALETTES
      ? (data.color_palette as PaletteKey)
      : DEFAULT_PALETTE;

  return (
    <div>
      <PageHeader
        title="Appearance"
        description="Choose the colour palette for the whole hub — applies for everyone, including the sign-in page."
      />
      <PaletteForm current={currentKey} />
    </div>
  );
}
