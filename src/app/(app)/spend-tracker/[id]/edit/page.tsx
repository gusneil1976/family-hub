"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRequireAccess } from "@/lib/client/me";
import { useSyncedAction } from "@/lib/client/save";
import Loading from "../../../loading";
import {
  TRANSACTION_KEYS,
  useSpendCategories,
  useSpenders,
  useTransaction,
  useVendors,
} from "../../data";
import { TransactionForm } from "../../transaction-form";
import { updateTransaction } from "./actions";
import { DeleteTransactionButton } from "./delete-transaction-button";

export default function EditTransactionPage() {
  const { id } = useParams<{ id: string }>();
  const me = useRequireAccess((p) => p.has_spend_tracker_access);
  const transaction = useTransaction(id);
  const categories = useSpendCategories();
  const vendors = useVendors();
  const spenders = useSpenders();
  // updateTransaction redirects to the list; re-sync first so the change
  // (new category, amount, vendor…) is already showing when it opens.
  const action = useSyncedAction(updateTransaction.bind(null, id), [...TRANSACTION_KEYS]);

  if (
    !me ||
    transaction.data === undefined ||
    !categories.data ||
    !vendors.data ||
    !spenders.data
  )
    return <Loading />;

  if (transaction.data === null) {
    return (
      <div>
        <p className="text-sm text-neutral-500">Transaction not found.</p>
        <Link
          href="/spend-tracker"
          className="mt-2 inline-block text-sm text-neutral-500 underline hover:text-neutral-900"
        >
          Back to Spend Tracker
        </Link>
      </div>
    );
  }

  const t = transaction.data;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Edit transaction
      </h1>
      <TransactionForm
        // Remount if a background re-sync brings different values, so the
        // uncontrolled inputs show them.
        key={`${t.id}:${t.date}:${t.amount}:${t.category_id}:${t.spent_by}:${t.vendor?.name}:${t.notes}`}
        action={action}
        categories={categories.data}
        vendorNames={vendors.data.map((v) => v.name)}
        spentByOptions={spenders.data}
        defaultValues={{
          date: t.date,
          vendor: t.vendor?.name ?? "",
          amount: t.amount,
          category_id: t.category_id ?? "",
          spent_by: t.spent_by,
          notes: t.notes,
        }}
        submitLabel="Save changes"
      />
      <div className="mt-6 border-t border-neutral-200 pt-4">
        <DeleteTransactionButton transactionId={t.id} />
      </div>
    </div>
  );
}
