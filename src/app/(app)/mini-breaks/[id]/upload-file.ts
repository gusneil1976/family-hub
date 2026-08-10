import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

// Uploads to the private mini-break-files bucket — access is gated by
// storage.objects RLS (can_access_mini_breaks()), not a public URL, since
// these are ticket screenshots and similar travel documents.
export async function uploadMiniBreakFile(
  supabase: SupabaseClient,
  miniBreakId: string,
  file: File,
): Promise<{ path?: string; error?: string }> {
  if (file.size === 0) {
    return { error: "Choose a file first." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: "File must be smaller than 5MB." };
  }
  if (file.type !== "image/jpeg") {
    return { error: "Only JPG files are supported." };
  }

  const path = `${miniBreakId}/${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("mini-break-files")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { error: uploadError.message };
  }

  return { path };
}
