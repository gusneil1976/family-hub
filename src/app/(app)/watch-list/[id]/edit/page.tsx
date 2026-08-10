import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import type { WatchListItem } from "@/lib/types";
import { WatchItemForm } from "../../watch-item-form";
import { updateWatchListItem } from "./actions";
import { DeleteItemButton } from "./delete-item-button";

export default async function EditWatchListItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user, profile } = await requireUser();

  const { data: item } = await supabase
    .from("watch_list_items")
    .select("*")
    .eq("id", id)
    .single<WatchListItem>();

  if (!item) {
    notFound();
  }

  const canManage =
    item.submitted_by === user.id || !!profile?.is_admin || !!profile?.is_kiosk;
  if (!canManage) {
    redirect("/watch-list");
  }

  const { data: rows } = await supabase
    .from("watch_list_items")
    .select("platform")
    .order("platform");

  const platformOptions = Array.from(
    new Set((rows ?? []).map((r) => r.platform)),
  );

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Edit suggestion
      </h1>
      <WatchItemForm
        action={updateWatchListItem.bind(null, item.id)}
        platformOptions={platformOptions}
        defaultValues={{
          title: item.title,
          category: item.category,
          platform: item.platform,
        }}
        submitLabel="Save changes"
      />
      <div className="mt-6 border-t border-neutral-200 pt-4">
        <DeleteItemButton itemId={item.id} />
      </div>
    </div>
  );
}
