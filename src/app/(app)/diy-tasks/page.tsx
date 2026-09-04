import Link from "next/link";
import { requireUser } from "@/lib/auth";
import type { DiyTask } from "@/lib/types";
import { Badge, PageHeader } from "@/components/ui";
import { KIOSK_BUTTON_PRIMARY, KIOSK_LINK } from "../kiosk-styles";
import { CompleteToggle } from "./complete-toggle";
import { ProgressSlider } from "./progress-slider";

const NO_PROJECT = "No project";

function groupByProject(items: DiyTask[]) {
  const groups = new Map<string, DiyTask[]>();
  for (const task of items) {
    const key = task.project?.trim() || NO_PROJECT;
    const existing = groups.get(key);
    if (existing) {
      existing.push(task);
    } else {
      groups.set(key, [task]);
    }
  }
  return [...groups.entries()].sort(([a], [b]) => {
    if (a === NO_PROJECT) return 1;
    if (b === NO_PROJECT) return -1;
    return a.localeCompare(b);
  });
}

function ProjectGroups({
  items,
  canManage,
  isKiosk,
}: {
  items: DiyTask[];
  canManage: (task: DiyTask) => boolean;
  isKiosk: boolean;
}) {
  if (!items.length) {
    return (
      <p className={isKiosk ? "text-base text-neutral-500" : "text-sm text-neutral-500"}>
        Nothing here yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {groupByProject(items).map(([project, tasks]) => (
        <details
          key={project}
          open
          className="overflow-hidden rounded-xl border border-card-border bg-card shadow-sm"
        >
          <summary
            className={`cursor-pointer select-none px-4 py-3 font-semibold text-neutral-700 ${
              isKiosk ? "text-lg" : "text-sm"
            }`}
          >
            {project}{" "}
            <span className="font-normal text-neutral-400">
              ({tasks.length})
            </span>
          </summary>
          <ul className="divide-y divide-neutral-200 border-t border-neutral-200">
            {tasks.map((task) => (
              <li
                key={task.id}
                className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${
                  isKiosk ? "text-base" : "text-sm"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-medium text-neutral-900 ${isKiosk ? "text-lg" : ""}`}
                    >
                      {task.title}
                    </span>
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
                  <ProgressSlider
                    taskId={task.id}
                    initialPercent={task.percent_complete}
                  />
                  <CompleteToggle
                    taskId={task.id}
                    completed={!!task.completed_at}
                    isKiosk={isKiosk}
                  />
                  {canManage(task) && (
                    <Link
                      href={`/diy-tasks/${task.id}/edit`}
                      className={
                        isKiosk
                          ? `text-neutral-500 hover:text-neutral-900 ${KIOSK_LINK}`
                          : "text-sm text-neutral-500 underline hover:text-neutral-900"
                      }
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}

export default async function DiyTasksPage() {
  const { supabase, user, profile } = await requireUser();
  const isKiosk = !!profile?.is_kiosk;

  const { data: tasks } = await supabase
    .from("diy_tasks")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<DiyTask[]>();

  const all = tasks ?? [];
  const canManage = (task: DiyTask) =>
    task.created_by === user.id || !!profile?.is_admin || !!profile?.is_kiosk;

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
            className={
              isKiosk
                ? `bg-accent text-accent-foreground hover:bg-accent-hover ${KIOSK_BUTTON_PRIMARY}`
                : "rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
            }
          >
            New task
          </Link>
        }
      />

      <section className="mb-6">
        <ProjectGroups items={active} canManage={canManage} isKiosk={isKiosk} />
      </section>

      {completed.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-neutral-700">
            Completed
          </h2>
          <ProjectGroups items={completed} canManage={canManage} isKiosk={isKiosk} />
        </section>
      )}
    </div>
  );
}
