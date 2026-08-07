"use server";

import { revalidatePath } from "next/cache";
import { requireSpendTrackerAccess } from "@/lib/auth";

export async function renameVendor(vendorId: string, name: string) {
  const { supabase } = await requireSpendTrackerAccess();

  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Vendor name can't be empty.");
  }

  const { error } = await supabase
    .from("vendors")
    .update({ name: trimmed })
    .eq("id", vendorId);

  if (error) {
    throw new Error(
      error.code === "23505"
        ? "Another vendor already has that name."
        : error.message,
    );
  }

  revalidatePath("/spend-tracker/vendors");
  revalidatePath("/spend-tracker");
  revalidatePath("/spend-tracker/new");
}

export async function deleteVendor(vendorId: string) {
  const { supabase } = await requireSpendTrackerAccess();

  const { error } = await supabase.from("vendors").delete().eq("id", vendorId);

  if (error) {
    throw new Error(
      error.message.toLowerCase().includes("foreign key")
        ? "Can't delete — this vendor has transactions logged against it."
        : error.message,
    );
  }

  revalidatePath("/spend-tracker/vendors");
}
