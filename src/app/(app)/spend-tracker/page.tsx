import Link from "next/link";
import { requireSpendTrackerAccess } from "@/lib/auth";
import { Badge, PageHeader, StatTile, StatTileRow } from "@/components/ui";
import { formatGBP } from "./format";

type TransactionRow = {
  id: string;
  date: string;
  amount: number;
  spent_by: string;
  vendor: { name: string } | null;
  category: { name: string } | null;
  spender: { display_name: string | null } | null;
};

export default async function SpendTrackerPage() {
  const { supabase, user } = await requireSpendTrackerAccess();

  const { data: transactions } = await supabase
    .from("spend_transactions")
    .select(
      "id, date, amount, spent_by, vendor:vendors(name), category:spend_categories(name), spender:profiles!spend_transactions_spent_by_fkey(display_name)",
    )
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<TransactionRow[]>();

  const all = transactions ?? [];

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisMonth = all.filter((t) => t.date.startsWith(monthPrefix));
  const thisMonthTotal = thisMonth.reduce((sum, t) => sum + t.amount, 0);

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

      <StatTileRow>
        <StatTile emphasize label="This month" value={formatGBP(thisMonthTotal)} />
        <StatTile label="Transactions this month" value={thisMonth.length} />
      </StatTileRow>

      {all.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No transactions yet — add your first one.
        </p>
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
