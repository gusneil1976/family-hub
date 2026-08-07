"use server";

import { revalidatePath } from "next/cache";
import { requireSpendTrackerAccess } from "@/lib/auth";
import { findOrCreateVendor } from "../vendor-utils";
import { parseBankStatementCsv } from "./parse-bank-csv";

export type ImportDraftRow = {
  date: string;
  rawDescription: string;
  vendor: string;
  categoryId: string | null;
  amount: number;
};

type ParseResult =
  | { error: string }
  | { rows: ImportDraftRow[]; skippedDuplicates: number };

const DUPLICATE_AMOUNT_TOLERANCE = 0.05;
const DUPLICATE_DAY_TOLERANCE = 2;

function addDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime();
  return Math.abs(diff) / msPerDay;
}

export async function parseImportCsv(formData: FormData): Promise<ParseResult> {
  const { supabase } = await requireSpendTrackerAccess();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a CSV file first." };
  }

  const text = await file.text();
  const bankRows = parseBankStatementCsv(text);

  if (bankRows.length === 0) {
    return { error: "No outgoing transactions found in that file." };
  }

  const dates = bankRows.map((r) => r.date).sort();
  const rangeStart = addDays(dates[0], -DUPLICATE_DAY_TOLERANCE);
  const rangeEnd = addDays(dates[dates.length - 1], DUPLICATE_DAY_TOLERANCE);

  const [{ data: existing }, { data: vendors }, { data: recentTxns }] = await Promise.all([
    supabase
      .from("spend_transactions")
      .select("date, amount")
      .gte("date", rangeStart)
      .lte("date", rangeEnd)
      .returns<{ date: string; amount: number }[]>(),
    supabase.from("vendors").select("id, name").returns<{ id: string; name: string }[]>(),
    supabase
      .from("spend_transactions")
      .select("vendor_id, category_id, date")
      .order("date", { ascending: false })
      .returns<{ vendor_id: string; category_id: string | null; date: string }[]>(),
  ]);

  const existingTxns = existing ?? [];
  const isDuplicate = (row: { date: string; amount: number }) =>
    existingTxns.some(
      (t) =>
        Math.abs(t.amount - row.amount) <= DUPLICATE_AMOUNT_TOLERANCE &&
        daysBetween(t.date, row.date) <= DUPLICATE_DAY_TOLERANCE,
    );

  const latestCategoryByVendor = new Map<string, string | null>();
  for (const t of recentTxns ?? []) {
    if (!latestCategoryByVendor.has(t.vendor_id)) {
      latestCategoryByVendor.set(t.vendor_id, t.category_id);
    }
  }
  const vendorIdByName = new Map(
    (vendors ?? []).map((v) => [v.name.toLowerCase(), v.id]),
  );

  const rows: ImportDraftRow[] = [];
  let skippedDuplicates = 0;

  for (const bankRow of bankRows) {
    if (isDuplicate(bankRow)) {
      skippedDuplicates++;
      continue;
    }

    const matchedVendorId = vendorIdByName.get(bankRow.suggestedVendor.toLowerCase());
    const categoryId =
      matchedVendorId !== undefined
        ? (latestCategoryByVendor.get(matchedVendorId) ?? null)
        : null;

    rows.push({
      date: bankRow.date,
      rawDescription: bankRow.rawDescription,
      vendor: bankRow.suggestedVendor,
      categoryId,
      amount: bankRow.amount,
    });
  }

  return { rows, skippedDuplicates };
}

export async function commitImport(
  rows: ImportDraftRow[],
): Promise<{ error?: string; imported?: number }> {
  const { supabase, user } = await requireSpendTrackerAccess();

  if (rows.length === 0) {
    return { error: "No rows selected." };
  }

  const toInsert: {
    date: string;
    vendor_id: string;
    category_id: string | null;
    amount: number;
    spent_by: string;
  }[] = [];

  for (const row of rows) {
    const vendorName = row.vendor.trim();
    if (!vendorName) {
      return { error: `Vendor is required for the ${row.date} transaction.` };
    }
    const vendor = await findOrCreateVendor(supabase, vendorName);
    if (vendor.error) {
      return { error: vendor.error };
    }
    toInsert.push({
      date: row.date,
      vendor_id: vendor.id,
      category_id: row.categoryId,
      amount: row.amount,
      spent_by: user.id,
    });
  }

  const { error } = await supabase.from("spend_transactions").insert(toInsert);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/spend-tracker");
  revalidatePath("/spend-tracker/report");

  return { imported: toInsert.length };
}
