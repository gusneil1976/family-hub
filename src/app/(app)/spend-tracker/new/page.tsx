import { requireSpendTrackerAccess } from "@/lib/auth";
import type { SpendCategory, Vendor } from "@/lib/types";
import { TransactionForm } from "../transaction-form";
import { createTransaction } from "./actions";

export default async function NewTransactionPage() {
  const { supabase } = await requireSpendTrackerAccess();

  const [{ data: categories }, { data: vendors }] = await Promise.all([
    supabase
      .from("spend_categories")
      .select("*")
      .order("name")
      .returns<SpendCategory[]>(),
    supabase.from("vendors").select("*").order("name").returns<Vendor[]>(),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Add transaction
      </h1>
      <TransactionForm
        action={createTransaction}
        categories={categories ?? []}
        vendorNames={(vendors ?? []).map((v) => v.name)}
        submitLabel="Add transaction"
      />
    </div>
  );
}
