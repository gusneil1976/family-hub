import { requireUser } from "@/lib/auth";
import type { Profile } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { startOfMonth, startOfWeek } from "../date-utils";

type CompletionRow = {
  points: number;
  completed_by: string;
  completed_at: string;
};

export default async function ScoreboardPage() {
  const { supabase } = await requireUser();

  const now = new Date();
  const weekStart = startOfWeek(now);
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const monthStart = startOfMonth(now);
  const earliest = lastWeekStart < monthStart ? lastWeekStart : monthStart;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_archived", false)
    .eq("is_kiosk", false)
    .order("display_name")
    .returns<Profile[]>();

  // Only completions of approved tasks count — filtered via an inner join
  // so a task's points_approved flag is evaluated live, retroactively
  // counting completions logged while it was still pending.
  const { data: completions } = await supabase
    .from("task_completions")
    .select("points, completed_by, completed_at, tasks!inner(points_approved)")
    .eq("tasks.points_approved", true)
    .gte("completed_at", earliest.toISOString())
    .returns<CompletionRow[]>();

  const totals = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      { thisWeek: 0, lastWeek: 0, thisMonth: 0 },
    ]),
  );

  for (const c of completions ?? []) {
    const entry = totals.get(c.completed_by);
    if (!entry) continue;
    const at = new Date(c.completed_at);
    if (at >= monthStart) entry.thisMonth += c.points;
    if (at >= weekStart) entry.thisWeek += c.points;
    else if (at >= lastWeekStart) entry.lastWeek += c.points;
  }

  const rows = (profiles ?? [])
    .map((p) => ({ profile: p, ...totals.get(p.id)! }))
    .sort((a, b) => b.thisMonth - a.thisMonth);

  return (
    <div>
      <PageHeader title="Scoreboard" />
      <div className="overflow-x-auto rounded-xl border border-card-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-sidebar text-left text-sidebar-muted">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">This week</th>
              <th className="px-4 py-2 font-medium">Last week</th>
              <th className="px-4 py-2 font-medium">This month</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {rows.map((row, i) => (
              <tr
                key={row.profile.id}
                className={i === 0 && row.thisMonth > 0 ? "bg-accent-soft" : ""}
              >
                <td className="px-4 py-2 font-medium text-neutral-900">
                  {i === 0 && row.thisMonth > 0 ? "🏆 " : ""}
                  {row.profile.display_name}
                </td>
                <td className="px-4 py-2">{row.thisWeek}</td>
                <td className="px-4 py-2">{row.lastWeek}</td>
                <td className="px-4 py-2 font-semibold">{row.thisMonth}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
