"use client";

import { useRequireAccess } from "@/lib/client/me";
import { useSyncedAction } from "@/lib/client/save";
import Loading from "../../loading";
import { TRANSACTION_KEYS, useSpendCategories, useVendors } from "../data";
import { TransactionForm } from "../transaction-form";
import { createTransaction } from "./actions";

export default function NewTransactionPage() {
  const me = useRequireAccess((p) => p.has_spend_tracker_access);
  const categories = useSpendCategories();
  const vendors = useVendors();
  // createTransaction redirects to the list; re-sync first so the new row
  // (and any vendor it created) is already there when it opens.
  const action = useSyncedAction(createTransaction, [...TRANSACTION_KEYS]);

  if (!me || !categories.data || !vendors.data) return <Loading />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Add transaction
      </h1>
      <TransactionForm
        action={action}
        categories={categories.data}
        vendorNames={vendors.data.map((v) => v.name)}
        submitLabel="Add transaction"
      />
    </div>
  );
}
