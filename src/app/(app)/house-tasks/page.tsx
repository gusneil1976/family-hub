"use client";

import Link from "next/link";
import type { Profile } from "@/lib/types";
import { PageHeader, StatTile, StatTileRow } from "@/components/ui";
import { useMe } from "@/lib/client/me";
import { KIOSK_BUTTON_PRIMARY } from "../kiosk-styles";
import Loading from "../loading";
import { KioskTasksWithQuickAdd } from "./kiosk-tasks-with-quick-add";
import { TasksWithQuickAdd } from "./tasks-with-quick-add";
import { isOverdue, startOfWeek } from "./date-utils";
import { useFamily, useOpenTasks, useUpcomingBakingSteps, type TaskRow } from "./data";

type PersonSummary = Pick<Profile, "id" | "display_name">;

export default function HouseTasksPage() {
  const { data: me } = useMe();
  const profile = me?.profile;
  const tasks = useOpenTasks();
  const bakingSteps = useUpcomingBakingSteps(!!profile?.has_baking_access);
  // Kiosk has no personal identity to credit points to automatically, so
  // completing a task there asks who actually did it.
  const family = useFamily(!!profile?.is_kiosk);

  if (!me || !tasks.data || (profile?.is_kiosk && !family.data)) return <Loading />;

  const user = me.user;
  const all = tasks.data;
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
  const kioskProfiles = family.data ?? [];

  // Kiosk has no "logged in as" identity, so "My tasks"/"Other tasks" would
  // just be "nothing"/"everything" — with only a handful of family members,
  // one calendar per person is more useful. Anything not assigned to one of
  // them (e.g. an archived member) falls back into a catch-all "Other".
  const peopleTasks = profile?.is_kiosk
    ? (() => {
        const groups: { person: PersonSummary; tasks: TaskRow[] }[] =
          kioskProfiles.map((person) => ({
            person,
            tasks: all.filter((t) => t.assigned_to === person.id),
          }));
        const assignedIds = new Set(kioskProfiles.map((p) => p.id));
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

  const stats = (
    <StatTileRow>
      <StatTile emphasize label="My tasks" value={myTasks.length} />
      <StatTile label="Total pending" value={all.length} />
      <StatTile label="Due this week" value={dueThisWeek} />
      <StatTile label="Overdue" value={overdueCount} />
    </StatTileRow>
  );

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

      {profile?.is_kiosk ? (
        <KioskTasksWithQuickAdd
          myTasks={myTasks}
          otherTasks={otherTasks}
          editableTaskIds={editableTaskIds}
          bakingSteps={bakingSteps.data ?? []}
          kioskProfiles={kioskProfiles}
          peopleTasks={peopleTasks ?? []}
        >
          {stats}
        </KioskTasksWithQuickAdd>
      ) : (
        <TasksWithQuickAdd
          myTasks={myTasks}
          otherTasks={otherTasks}
          editableTaskIds={editableTaskIds}
          bakingSteps={bakingSteps.data ?? []}
          currentUserId={user.id}
        >
          {stats}
        </TasksWithQuickAdd>
      )}
    </div>
  );
}
