import { requireUser } from "@/lib/auth";
import type { Profile } from "@/lib/types";
import { WatchItemForm } from "../watch-item-form";
import { createWatchListItem } from "./actions";

export default async function NewWatchListItemPage() {
  const { supabase, profile } = await requireUser();

  const { data: rows } = await supabase
    .from("watch_list_items")
    .select("platform")
    .order("platform");

  const platformOptions = Array.from(
    new Set((rows ?? []).map((r) => r.platform)),
  );

  const { data: kioskProfiles } = profile?.is_kiosk
    ? await supabase
        .from("profiles")
        .select("*")
        .eq("is_archived", false)
        .eq("is_kiosk", false)
        .order("display_name")
        .returns<Profile[]>()
    : { data: null };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Suggest something to watch
      </h1>
      <WatchItemForm
        action={createWatchListItem}
        platformOptions={platformOptions}
        submitLabel="Add to list"
        kioskProfiles={kioskProfiles ?? undefined}
      />
    </div>
  );
}
