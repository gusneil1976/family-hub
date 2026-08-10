"use server";

import { redirect } from "next/navigation";
import { requireSpendTrackerAccess } from "@/lib/auth";
import { findOrCreateVendor } from "../vendor-utils";

type ActionState = { error: string } | undefined;

export async function createTransaction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireSpendTrackerAccess();

  const vendorName = String(formData.get("vendor") ?? "").trim();
  if (!vendorName) {
    return { error: "Vendor is required." };
  }

  const amount = Number(formData.get("amount") ?? "");
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a valid amount." };
  }

  const date =
    String(formData.get("date") ?? "").trim() ||
    new Date().toISOString().slice(0, 10);
  const categoryId = String(formData.get("category_id") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const vendor = await findOrCreateVendor(supabase, vendorName);
  if (vendor.error) {
    return { error: vendor.error };
  }

  const { error } = await supabase.from("spend_transactions").insert({
    date,
    vendor_id: vendor.id,
    category_id: categoryId,
    amount,
    spent_by: user.id,
    notes,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/spend-tracker");
}
