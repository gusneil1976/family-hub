"use client";

import { useRouter } from "next/navigation";
import { useSave } from "@/lib/client/save";
import { removeTransactionFromCache, TRANSACTION_KEYS } from "../../data";
import { deleteTransaction } from "./actions";

export function DeleteTransactionButton({
  transactionId,
}: {
  transactionId: string;
}) {
  const save = useSave();
  const router = useRouter();

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (!confirm("Delete this transaction? This can't be undone.")) return;
          // Back to the list straight away with the row already gone; if the
          // server refuses, the row comes back and an error toast explains.
          void save(() => deleteTransaction(transactionId), {
            keys: [...TRANSACTION_KEYS],
            optimistic: (qc) => removeTransactionFromCache(qc, transactionId),
          });
          router.push("/spend-tracker");
        }}
        className="text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
      >
        Delete transaction
      </button>
    </div>
  );
}
