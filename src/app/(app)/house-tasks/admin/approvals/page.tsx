import { requireHouseTasksAdmin } from "@/lib/auth";
import type { Task } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { approveTaskPoints } from "./actions";
import { ApproveForm } from "./approve-form";

type TaskRow = Task & { creator: { display_name: string | null } | null };

export default async function ApprovalsPage() {
  const { supabase } = await requireHouseTasksAdmin();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, creator:profiles!tasks_created_by_fkey(display_name)")
    .eq("points_approved", false)
    .order("created_at")
    .returns<TaskRow[]>();

  return (
    <div>
      <PageHeader
        title="Approve points"
        description="These tasks won't count toward the scoreboard until approved. Once approved, future recurrences don't need re-approval."
      />

      {!tasks?.length ? (
        <p className="text-sm text-neutral-500">
          Nothing waiting on approval.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <span>
                <span className="font-medium text-neutral-900">
                  {task.title}
                </span>
                <span className="ml-2 text-neutral-500">
                  by {task.creator?.display_name ?? "someone"}
                </span>
              </span>
              <ApproveForm
                currentPoints={task.points}
                action={approveTaskPoints.bind(null, task.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
