import Link from "next/link";
import { requireUser } from "@/lib/auth";
import type { Task } from "@/lib/types";
import { Badge, PageHeader, StatTile, StatTileRow } from "@/components/ui";
import { CompleteButton } from "./complete-button";
import { formatRecurrence, isOverdue, startOfWeek } from "./date-utils";

type TaskRow = Task & {
  assignee: { display_name: string | null } | null;
};

function TaskGroup({
  items,
  canEdit,
}: {
  items: TaskRow[];
  canEdit: (task: TaskRow) => boolean;
}) {
  if (!items.length) {
    return <p className="text-sm text-neutral-500">Nothing here.</p>;
  }

  return (
    <ul className="divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
      {items.map((task) => {
        const recurrence = formatRecurrence(
          task.recurrence_unit,
          task.recurrence_value,
        );
        const overdue = isOverdue(task.due_date);

        return (
          <li
            key={task.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-neutral-900">
                  {task.title}
                </span>
                <Badge variant="accent">
                  {task.points} pt{task.points === 1 ? "" : "s"}
                </Badge>
                {!task.points_approved && (
                  <Badge variant="warning">Pending approval</Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-neutral-500">
                {task.assignee?.display_name && (
                  <span>Assigned to {task.assignee.display_name}</span>
                )}
                {recurrence && <span> · {recurrence}</span>}
                {task.due_date && (
                  <span className={overdue ? "text-red-600" : ""}>
                    {" "}
                    · Due {task.due_date}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {canEdit(task) && (
                <Link
                  href={`/house-tasks/${task.id}/edit`}
                  className="text-sm text-neutral-500 underline hover:text-neutral-900"
                >
                  Edit
                </Link>
              )}
              <CompleteButton taskId={task.id} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

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
  const myTasks = all.filter((t) => t.assigned_to === user.id);
  const otherTasks = all.filter((t) => t.assigned_to !== user.id);

  const weekEnd = new Date(startOfWeek(new Date()));
  weekEnd.setDate(weekEnd.getDate() + 7);
  const dueThisWeek = all.filter(
    (t) => t.due_date && new Date(t.due_date) < weekEnd,
  ).length;
  const overdueCount = all.filter((t) => isOverdue(t.due_date)).length;

  const canEdit = (task: TaskRow) =>
    task.created_by === user.id ||
    !!profile?.is_admin ||
    !!profile?.is_house_tasks_admin;

  return (
    <div>
      <PageHeader
        title="Tasks"
        action={
          <Link
            href="/house-tasks/new"
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
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

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">
          My tasks
        </h2>
        <TaskGroup items={myTasks} canEdit={canEdit} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">
          Other tasks
        </h2>
        <TaskGroup items={otherTasks} canEdit={canEdit} />
      </section>
    </div>
  );
}
