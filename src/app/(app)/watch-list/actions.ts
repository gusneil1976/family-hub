"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

export async function setWatching(itemId: string, isWatching: boolean) {
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("watch_list_items")
    .update({ is_watching: isWatching })
    .eq("id", itemId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/watch-list");
}

export async function setWatched(itemId: string, watched: boolean) {
  const { supabase } = await requireUser();

  const update: {
    watched: boolean;
    watched_at: string | null;
    is_watching?: boolean;
  } = {
    watched,
    watched_at: watched ? new Date().toISOString() : null,
  };
  // Marking something watched implicitly means we're done "watching" it.
  if (watched) {
    update.is_watching = false;
  }

  const { error } = await supabase
    .from("watch_list_items")
    .update(update)
    .eq("id", itemId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/watch-list");
}
