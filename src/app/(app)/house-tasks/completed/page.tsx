"use client";

import { Badge, PageHeader } from "@/components/ui";
import { useMe } from "@/lib/client/me";
import Loading from "../../loading";
import { startOfMonth, startOfWeek } from "../date-utils";
import { useMonthCompletions, type CompletionRow } from "../data";
import { UncompleteButton } from "./uncomplete-button";

function CompletionGroup({
  title,
  items,
}: {
  title: string;
  items: CompletionRow[];
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-semibold text-neutral-700">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-500">Nothing here.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
          {items.map((c) => {
            const missed = c.points < 0;
            return (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
              >
                <span>
                  <span className="font-medium text-neutral-900">
                    {c.tasks?.title ?? "Deleted task"}
                  </span>
                  <span className="ml-2 text-neutral-500">
                    {missed
                      ? `not completed — ${c.profiles?.display_name ?? "someone"}${
                          c.closed_task ? " (closed)" : ""
                        }`
                      : `by ${c.profiles?.display_name ?? "someone"}`}
                  </span>
                </span>
                <div className="flex items-center gap-3">
                  <Badge variant={missed ? "danger" : "accent"}>
                    {c.points} pts
                  </Badge>
                  <UncompleteButton completionId={c.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function CompletedPage() {
  const { data: me } = useMe();
  const completions = useMonthCompletions(startOfMonth(new Date()));

  if (!me || !completions.data) return <Loading />;

  const now = new Date();
  const weekStart = startOfWeek(now);
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const thisWeek: CompletionRow[] = [];
  const lastWeek: CompletionRow[] = [];
  const earlierThisMonth: CompletionRow[] = [];

  for (const c of completions.data) {
    const at = new Date(c.completed_at);
    if (at >= weekStart) thisWeek.push(c);
    else if (at >= lastWeekStart) lastWeek.push(c);
    else earlierThisMonth.push(c);
  }

  return (
    <div>
      <PageHeader title="Completed" />
      <CompletionGroup title="This week" items={thisWeek} />
      <CompletionGroup title="Last week" items={lastWeek} />
      <CompletionGroup title="Earlier this month" items={earlierThisMonth} />
    </div>
  );
}
