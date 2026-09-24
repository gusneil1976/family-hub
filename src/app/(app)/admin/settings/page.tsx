"use client";

import { PageHeader } from "@/components/ui";
import { useRequireAccess } from "@/lib/client/me";
import Loading from "../../loading";
import { useHubSettings } from "./data";
import { PaletteForm } from "./palette-form";

export default function AppearanceSettingsPage() {
  const me = useRequireAccess((p) => p.is_admin);
  const settings = useHubSettings();

  if (!me || !settings.data) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Appearance"
        description="Choose the colour palette for the whole hub — applies for everyone, including the sign-in page."
      />
      <PaletteForm current={settings.data.color_palette} />
    </div>
  );
}
