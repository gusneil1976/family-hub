"use client";

import { useRequireAccess } from "@/lib/client/me";
import Loading from "../../loading";
import { useVendors } from "../data";
import { VendorRow } from "./vendor-row";

export default function VendorsPage() {
  const me = useRequireAccess((p) => p.has_spend_tracker_access);
  const vendors = useVendors();

  if (!me || !vendors.data) return <Loading />;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-foreground">Vendors</h1>
      <p className="mb-4 text-sm text-neutral-500">
        New vendors are added automatically when you log a transaction —
        rename one here to fix a typo.
      </p>

      {vendors.data.length ? (
        <ul className="divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
          {vendors.data.map((vendor) => (
            // Keyed by name too, so a rename arriving from elsewhere (or a
            // rolled-back one) resets the input box to the saved name.
            <VendorRow key={`${vendor.id}:${vendor.name}`} id={vendor.id} name={vendor.name} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-500">No vendors yet.</p>
      )}
    </div>
  );
}
