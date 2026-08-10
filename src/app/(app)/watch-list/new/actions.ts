"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import type { WatchCategory } from "@/lib/types";

type ActionState = { error: string } | undefined;

export async function createWatchListItem(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

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

  const { error } = await supabase.from("watch_list_items").insert({
    title,
    category,
    platform,
    submitted_by: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/watch-list");
}
