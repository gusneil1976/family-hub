"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge, PageHeader, StatTile, StatTileRow } from "@/components/ui";
import { useRequireAccess } from "@/lib/client/me";
import Loading from "../loading";
import { useTransactions } from "./data";
import { formatGBP } from "./format";
import { MonthPicker } from "./month-picker";
import { monthKey, parseMonth } from "./month-utils";

// The month comes from ?month=, which needs a Suspense boundary on a client page.
export default function SpendTrackerPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SpendTrackerScreen />
    </Suspense>
  );
}

function SpendTrackerScreen() {
  const me = useRequireAccess((p) => p.has_spend_tracker_access);
  const { year, month } = parseMonth(useSearchParams().get("month") ?? undefined);
  const transactions = useTransactions(year, month, monthKey(year, month));

  if (!me || !transactions.data) return <Loading />;

  const user = me.user;
  const all = transactions.data;
  const total = all.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div>
      <PageHeader
        title="Spend Tracker"
        action={
          <Link
            href="/spend-tracker/new"
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            Add transaction
          </Link>
        }
      />

      <div className="mb-4">
        <MonthPicker value={monthKey(year, month)} />
      </div>

      <StatTileRow>
        <StatTile emphasize label="Total" value={formatGBP(total)} />
        <StatTile label="Transactions" value={all.length} />
      </StatTileRow>

      {all.length === 0 ? (
        <p className="text-sm text-neutral-500">No transactions this month.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
          {all.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-neutral-900">
                    {t.vendor?.name ?? "Unknown vendor"}
                  </span>
                  {t.category?.name && <Badge variant="accent">{t.category.name}</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {t.date}
                  {t.spender?.display_name && <span> · {t.spender.display_name}</span>}
                  {t.spent_by === user.id && <span> (you)</span>}
                </p>
                {t.notes && (
                  <p className="mt-0.5 max-w-xs truncate text-xs text-neutral-400">
                    {t.notes}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-foreground">
                  {formatGBP(t.amount)}
                </span>
                <Link
                  href={`/spend-tracker/${t.id}/edit`}
                  className="text-sm text-neutral-500 underline hover:text-neutral-900"
                >
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
