import Link from "next/link";
import { requireUser } from "@/lib/auth";
import type { DiyTask } from "@/lib/types";
import { Badge, PageHeader } from "@/components/ui";
import { CompleteToggle } from "./complete-toggle";
import { ProgressSlider } from "./progress-slider";

function TaskList({
  items,
  canManage,
}: {
  items: DiyTask[];
  canManage: (task: DiyTask) => boolean;
}) {
  if (!items.length) {
    return <p className="text-sm text-neutral-500">Nothing here yet.</p>;
  }

  return (
    <ul className="divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
      {items.map((task) => (
        <li
          key={task.id}
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-neutral-900">
                {task.title}
              </span>
              {task.project && <Badge variant="accent">{task.project}</Badge>}
              {task.hours_estimate != null && (
                <Badge>{task.hours_estimate}h est.</Badge>
              )}
            </div>
            {task.notes && (
              <p className="mt-0.5 max-w-md truncate text-xs text-neutral-500">
                {task.notes}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <ProgressSlider taskId={task.id} initialPercent={task.percent_complete} />
            <CompleteToggle taskId={task.id} completed={!!task.completed_at} />
            {canManage(task) && (
              <Link
                href={`/diy-tasks/${task.id}/edit`}
                className="text-sm text-neutral-500 underline hover:text-neutral-900"
              >
                Edit
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function DiyTasksPage() {
  const { supabase, user, profile } = await requireUser();

  const { data: tasks } = await supabase
    .from("diy_tasks")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<DiyTask[]>();

  const all = tasks ?? [];
  const canManage = (task: DiyTask) =>
    task.created_by === user.id || !!profile?.is_admin;

  const active = all.filter((t) => !t.completed_at);
  const completed = all
    .filter((t) => t.completed_at)
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));

  return (
    <div>
      <PageHeader
        title="DIY Tasks"
        description="Home-improvement projects."
        action={
          <Link
            href="/diy-tasks/new"
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            New task
          </Link>
        }
      />

      <section className="mb-6">
        <TaskList items={active} canManage={canManage} />
      </section>

      {completed.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-neutral-700">
            Completed
          </h2>
          <TaskList items={completed} canManage={canManage} />
        </section>
      )}
    </div>
  );
}
