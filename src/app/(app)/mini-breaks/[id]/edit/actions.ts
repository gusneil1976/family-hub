"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireMiniBreaksAccess } from "@/lib/auth";

type ActionState = { error: string } | undefined;

export async function updateMiniBreak(
  miniBreakId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireMiniBreaksAccess();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    return { error: "Title is required." };
  }

  const dateFrom = String(formData.get("date_from") ?? "").trim() || null;
  const dateTo = String(formData.get("date_to") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const { error } = await supabase
    .from("mini_breaks")
    .update({ title, date_from: dateFrom, date_to: dateTo, notes })
    .eq("id", miniBreakId);

  if (error) {
    return { error: error.message };
  }

  redirect(`/mini-breaks/${miniBreakId}`);
}

export async function deleteMiniBreak(miniBreakId: string) {
  const { supabase } = await requireMiniBreaksAccess();

  const { data: files } = await supabase
    .from("mini_break_files")
    .select("file_path")
    .eq("mini_break_id", miniBreakId)
    .returns<{ file_path: string }[]>();

  if (files && files.length > 0) {
    await supabase.storage
      .from("mini-break-files")
      .remove(files.map((f) => f.file_path));
  }

  const { error } = await supabase
    .from("mini_breaks")
    .delete()
    .eq("id", miniBreakId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/mini-breaks");
}
