import Link from "next/link";
import { requireUser } from "@/lib/auth";
import type { Profile, Task } from "@/lib/types";
import { PageHeader, StatTile, StatTileRow } from "@/components/ui";
import { getUpcomingBakingSteps } from "../curing/get-due-steps";
import { KIOSK_BUTTON_PRIMARY } from "../kiosk-styles";
import { TaskBoard } from "./task-board";
import { isOverdue, startOfWeek } from "./date-utils";

type TaskRow = Task & {
  assignee: { display_name: string | null } | null;
};

type PersonSummary = Pick<Profile, "id" | "display_name">;

export default async function HouseTasksPage() {
  const { supabase, user, profile } = await requireUser();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, assignee:profiles!tasks_assigned_to_fkey(display_name)")
    .eq("is_active", true)
    .is("completed_at", null)
    .order("due_date", { ascending: true, nullsFirst: false })
    .returns<TaskRow[]>();

  const all = tasks ?? [];

  // Generously wide window, not week-precise — the calendar buckets by
  // local date client-side anyway (same reasoning as tasks, which aren't
  // date-filtered server-side at all). Only fetched for whoever has Curing
  // Projects access; everyone else's Calendar view is unaffected.
  let bakingSteps: Awaited<ReturnType<typeof getUpcomingBakingSteps>> = [];
  if (profile?.has_baking_access) {
    const rangeStart = new Date();
    rangeStart.setDate(rangeStart.getDate() - 14);
    const rangeEnd = new Date();
    rangeEnd.setDate(rangeEnd.getDate() + 90);
    bakingSteps = await getUpcomingBakingSteps(
      supabase,
      rangeStart.toISOString().slice(0, 10),
      rangeEnd.toISOString().slice(0, 10),
    );
  }
  const myTasks = all.filter((t) => t.assigned_to === user.id);
  const otherTasks = all.filter((t) => t.assigned_to !== user.id);

  const weekEnd = new Date(startOfWeek(new Date()));
  weekEnd.setDate(weekEnd.getDate() + 7);
  const dueThisWeek = all.filter(
    (t) => t.due_date && new Date(t.due_date) < weekEnd,
  ).length;
  const overdueCount = all.filter((t) =>
    isOverdue(t.due_date, t.due_time),
  ).length;

  const canEdit = (task: TaskRow) =>
    task.created_by === user.id ||
    !!profile?.is_admin ||
    !!profile?.is_house_tasks_admin ||
    !!profile?.is_kiosk;

  const editableTaskIds = all.filter(canEdit).map((t) => t.id);

  // Kiosk has no personal identity to credit points to automatically, so
  // completing a task there asks who actually did it.
  const { data: kioskProfiles } = profile?.is_kiosk
    ? await supabase
        .from("profiles")
        .select("*")
        .eq("is_archived", false)
        .eq("is_kiosk", false)
        .order("display_name")
        .returns<Profile[]>()
    : { data: null };

  // Kiosk has no "logged in as" identity, so "My tasks"/"Other tasks" would
  // just be "nothing"/"everything" — with only a handful of family members,
  // one calendar per person is more useful. Anything not assigned to one of
  // them (e.g. an archived member) falls back into a catch-all "Other".
  const peopleTasks = profile?.is_kiosk
    ? (() => {
        const people = kioskProfiles ?? [];
        const groups: { person: PersonSummary; tasks: TaskRow[] }[] =
          people.map((person) => ({
            person,
            tasks: all.filter((t) => t.assigned_to === person.id),
          }));
        const assignedIds = new Set(people.map((p) => p.id));
        const leftover = all.filter((t) => !assignedIds.has(t.assigned_to));
        if (leftover.length > 0) {
          groups.push({
            person: { id: "other", display_name: "Other" },
            tasks: leftover,
          });
        }
        return groups;
      })()
    : undefined;

  return (
    <div>
      <PageHeader
        title="Tasks"
        action={
          <Link
            href="/house-tasks/new"
            className={
              profile?.is_kiosk
                ? `bg-accent text-accent-foreground hover:bg-accent-hover ${KIOSK_BUTTON_PRIMARY}`
                : "rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
            }
          >
            New task
          </Link>
        }
      />

      <StatTileRow>
        <StatTile emphasize label="My tasks" value={myTasks.length} />
        <StatTile label="Total pending" value={all.length} />
        <StatTile label="Due this week" value={dueThisWeek} />
        <StatTile label="Overdue" value={overdueCount} />
      </StatTileRow>

      <TaskBoard
        myTasks={myTasks}
        otherTasks={otherTasks}
        editableTaskIds={editableTaskIds}
        bakingSteps={bakingSteps}
        kioskProfiles={kioskProfiles ?? undefined}
        peopleTasks={peopleTasks}
      />
    </div>
  );
}
