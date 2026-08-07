"use client";

import { usePathname, useRouter } from "next/navigation";
import { monthOptions } from "./month-utils";

export function MonthPicker({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const options = monthOptions();

  return (
    <select
      value={value}
      onChange={(e) => router.push(`${pathname}?month=${e.target.value}`)}
      className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
