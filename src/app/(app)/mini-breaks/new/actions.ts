"use server";

import { redirect } from "next/navigation";
import { requireMiniBreaksAccess } from "@/lib/auth";
import { uploadMiniBreakFile } from "../upload-file";

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

  // Links and files are best-effort at creation time — the detail page has
  // its own "Add" forms as a fallback if any of these individually fail,
  // so a problem here doesn't block the redirect below.
  const urls = formData.getAll("url").map(String);
  const categoryIds = formData.getAll("category_id").map(String);
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i].trim();
    if (!url) continue;
    await supabase.from("mini_break_urls").insert({
      mini_break_id: miniBreak.id,
      category_id: categoryIds[i]?.trim() || null,
      url,
    });
  }

  const files = formData.getAll("file");
  const descriptions = formData.getAll("description").map(String);
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!(file instanceof File) || file.size === 0) continue;
    const { path } = await uploadMiniBreakFile(supabase, miniBreak.id, file);
    if (path) {
      await supabase.from("mini_break_files").insert({
        mini_break_id: miniBreak.id,
        file_path: path,
        description: descriptions[i]?.trim() || null,
        uploaded_by: user.id,
      });
    }
  }

  redirect(`/mini-breaks/${miniBreak.id}`);
}
