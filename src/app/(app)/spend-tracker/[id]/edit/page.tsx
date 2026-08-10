import { notFound } from "next/navigation";
import { requireSpendTrackerAccess } from "@/lib/auth";
import type { Profile, SpendCategory, Vendor } from "@/lib/types";
import { TransactionForm } from "../../transaction-form";
import { updateTransaction } from "./actions";
import { DeleteTransactionButton } from "./delete-transaction-button";

type TransactionDetail = {
  id: string;
  date: string;
  amount: number;
  category_id: string | null;
  spent_by: string;
  notes: string | null;
  vendor: { name: string } | null;
};

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireSpendTrackerAccess();

  const { data: transaction } = await supabase
    .from("spend_transactions")
    .select(
      "id, date, amount, category_id, spent_by, notes, vendor:vendors(name)",
    )
    .eq("id", id)
    .single<TransactionDetail>();

  if (!transaction) {
    notFound();
  }

  const [{ data: categories }, { data: vendors }, { data: spenders }] =
    await Promise.all([
      supabase
        .from("spend_categories")
        .select("*")
        .order("name")
        .returns<SpendCategory[]>(),
      supabase.from("vendors").select("*").order("name").returns<Vendor[]>(),
      supabase
        .from("profiles")
        .select("*")
        .eq("has_spend_tracker_access", true)
        .order("display_name")
        .returns<Profile[]>(),
    ]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Edit transaction
      </h1>
      <TransactionForm
        action={updateTransaction.bind(null, transaction.id)}
        categories={categories ?? []}
        vendorNames={(vendors ?? []).map((v) => v.name)}
        spentByOptions={spenders ?? []}
        defaultValues={{
          date: transaction.date,
          vendor: transaction.vendor?.name ?? "",
          amount: transaction.amount,
          category_id: transaction.category_id ?? "",
          spent_by: transaction.spent_by,
          notes: transaction.notes,
        }}
        submitLabel="Save changes"
      />
      <div className="mt-6 border-t border-neutral-200 pt-4">
        <DeleteTransactionButton transactionId={transaction.id} />
      </div>
    </div>
  );
}
