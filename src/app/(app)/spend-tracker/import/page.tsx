import { requireSpendTrackerAccess } from "@/lib/auth";
import type { SpendCategory, Vendor } from "@/lib/types";
import { ImportFlow } from "./import-flow";

export default async function ImportPage() {
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
      <h1 className="mb-1 text-2xl font-bold text-foreground">
        Import from bank CSV
      </h1>
      <p className="mb-4 text-sm text-neutral-500">
        Upload a bank statement export to pick up transactions you forgot to
        log manually. Anything within £0.05 and 2 days of a transaction
        already logged is skipped automatically.
      </p>

      <ImportFlow categories={categories ?? []} vendorNames={(vendors ?? []).map((v) => v.name)} />
    </div>
  );
}
