import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// Vendors are meant to be frictionless — typing a new name on the
// transaction form just creates it, case-insensitively deduped, with no
// separate "add vendor first" step. The list is small enough (household
// finances) to compare in JS rather than risk ilike wildcard characters
// in a vendor name.
export async function findOrCreateVendor(
  supabase: SupabaseClient,
  name: string,
): Promise<{ id: string; error?: string }> {
  const trimmed = name.trim();

  const { data: vendors, error: listError } = await supabase
    .from("vendors")
    .select("id, name");
  if (listError) {
    return { id: "", error: listError.message };
  }

  const existing = vendors?.find(
    (v: { id: string; name: string }) =>
      v.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (existing) return { id: existing.id };

  const { data: created, error: insertError } = await supabase
    .from("vendors")
    .insert({ name: trimmed })
    .select("id")
    .single();

  if (insertError) {
    return { id: "", error: insertError.message };
  }

  return { id: created.id };
}
