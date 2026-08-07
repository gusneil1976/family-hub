import { requireSpendTrackerAccess } from "@/lib/auth";
import type { Vendor } from "@/lib/types";
import { VendorRow } from "./vendor-row";

export default async function VendorsPage() {
  const { supabase } = await requireSpendTrackerAccess();

  const { data: vendors } = await supabase
    .from("vendors")
    .select("*")
    .order("name")
    .returns<Vendor[]>();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-foreground">Vendors</h1>
      <p className="mb-4 text-sm text-neutral-500">
        New vendors are added automatically when you log a transaction —
        rename one here to fix a typo.
      </p>

      {vendors?.length ? (
        <ul className="divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
          {vendors.map((vendor) => (
            <VendorRow key={vendor.id} id={vendor.id} name={vendor.name} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-500">No vendors yet.</p>
      )}
    </div>
  );
}
