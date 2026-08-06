import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function uploadMealImage(
  supabase: SupabaseClient,
  mealId: string,
  file: File,
): Promise<{ url?: string; error?: string }> {
  if (file.size === 0) {
    return {};
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "Image must be smaller than 5MB." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "File must be an image." };
  }

  const ext =
    file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "jpg";
  const path = `${mealId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("meal-images")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data } = supabase.storage.from("meal-images").getPublicUrl(path);
  return { url: data.publicUrl };
}
