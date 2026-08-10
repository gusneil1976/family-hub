"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import type { WatchCategory, WatchListItem } from "@/lib/types";

type ActionState = { error: string } | undefined;

function canManage(
  item: Pick<WatchListItem, "submitted_by">,
  userId: string,
  profile: { is_admin: boolean; is_kiosk: boolean } | null,
) {
  return (
    item.submitted_by === userId || !!profile?.is_admin || !!profile?.is_kiosk
  );
}

export async function updateWatchListItem(
  itemId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user, profile } = await requireUser();

  const { data: item } = await supabase
    .from("watch_list_items")
    .select("submitted_by")
    .eq("id", itemId)
    .single<Pick<WatchListItem, "submitted_by">>();

  if (!item) {
    return { error: "Not found." };
  }
  if (!canManage(item, user.id, profile)) {
    return { error: "You can't edit this suggestion." };
  }

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    return { error: "Title is required." };
  }

  const categoryRaw = String(formData.get("category") ?? "");
  const category: WatchCategory | null =
    categoryRaw === "film" || categoryRaw === "tv_show" ? categoryRaw : null;
  if (!category) {
    return { error: "Pick a category." };
  }

  const platform = String(formData.get("platform") ?? "").trim();
  if (!platform) {
    return { error: "Streaming platform is required." };
  }

  const { error } = await supabase
    .from("watch_list_items")
    .update({ title, category, platform })
    .eq("id", itemId);

  if (error) {
    return { error: error.message };
  }

  redirect("/watch-list");
}

export async function deleteWatchListItem(itemId: string) {
  const { supabase, user, profile } = await requireUser();

  const { data: item } = await supabase
    .from("watch_list_items")
    .select("submitted_by")
    .eq("id", itemId)
    .single<Pick<WatchListItem, "submitted_by">>();

  if (!item) {
    throw new Error("Not found.");
  }
  if (!canManage(item, user.id, profile)) {
    throw new Error("You can't delete this suggestion.");
  }

  const { error } = await supabase
    .from("watch_list_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/watch-list");
}
