"use server";

import { redirect } from "next/navigation";
import { requireMiniBreaksAccess } from "@/lib/auth";

type ActionState = { error: string } | undefined;

export async function createMiniBreak(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireMiniBreaksAccess();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    return { error: "Title is required." };
  }

  const dateFrom = String(formData.get("date_from") ?? "").trim() || null;
  const dateTo = String(formData.get("date_to") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const { data: miniBreak, error } = await supabase
    .from("mini_breaks")
    .insert({
      title,
      date_from: dateFrom,
      date_to: dateTo,
      notes,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !miniBreak) {
    return { error: error?.message ?? "Failed to create." };
  }

  redirect(`/mini-breaks/${miniBreak.id}`);
}
