"use server";

import { revalidatePath } from "next/cache";
import { requireMiniBreaksAccess } from "@/lib/auth";
import { uploadMiniBreakFile } from "./upload-file";

type ActionState = { error: string } | undefined;

export async function addUrl(
  miniBreakId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireMiniBreaksAccess();

  const url = String(formData.get("url") ?? "").trim();
  if (!url) {
    return { error: "URL is required." };
  }
  const categoryId = String(formData.get("category_id") ?? "").trim() || null;

  const { error } = await supabase.from("mini_break_urls").insert({
    mini_break_id: miniBreakId,
    category_id: categoryId,
    url,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/mini-breaks/${miniBreakId}`);
}

export async function deleteUrl(miniBreakId: string, urlId: string) {
  const { supabase } = await requireMiniBreaksAccess();

  const { error } = await supabase
    .from("mini_break_urls")
    .delete()
    .eq("id", urlId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/mini-breaks/${miniBreakId}`);
}

export async function uploadFile(
  miniBreakId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireMiniBreaksAccess();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "Choose a file first." };
  }
  const description = String(formData.get("description") ?? "").trim() || null;

  const { path, error: uploadError } = await uploadMiniBreakFile(
    supabase,
    miniBreakId,
    file,
  );
  if (uploadError || !path) {
    return { error: uploadError ?? "Upload failed." };
  }

  const { error } = await supabase.from("mini_break_files").insert({
    mini_break_id: miniBreakId,
    file_path: path,
    description,
    uploaded_by: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/mini-breaks/${miniBreakId}`);
}

export async function deleteFile(miniBreakId: string, fileId: string) {
  const { supabase } = await requireMiniBreaksAccess();

  const { data: file } = await supabase
    .from("mini_break_files")
    .select("file_path")
    .eq("id", fileId)
    .single<{ file_path: string }>();

  if (file) {
    await supabase.storage.from("mini-break-files").remove([file.file_path]);
  }

  const { error } = await supabase
    .from("mini_break_files")
    .delete()
    .eq("id", fileId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/mini-breaks/${miniBreakId}`);
}
