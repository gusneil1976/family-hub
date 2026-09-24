"use client";

import { useRequireAccess } from "@/lib/client/me";
import Loading from "../../loading";
import { useSpendCategories, useVendors } from "../data";
import { ImportFlow } from "./import-flow";

export default function ImportPage() {
  const me = useRequireAccess((p) => p.has_spend_tracker_access);
  const categories = useSpendCategories();
  const vendors = useVendors();

  if (!me || !categories.data || !vendors.data) return <Loading />;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-foreground">
        Import from bank CSV
      </h1>
      <p className="mb-4 text-sm text-neutral-500">
        Upload a bank statement export to pick up transactions you forgot to
        log manually. Anything within £0.05 and 2 days of a transaction
        already logged is skipped automatically.
      </p>

      <ImportFlow categories={categories.data} vendorNames={vendors.data.map((v) => v.name)} />
    </div>
  );
}
