"use client";

import { PageHeader } from "@/components/ui";
import { useRequireAccess } from "@/lib/client/me";
import Loading from "../../../loading";
import { usePendingApprovals } from "../../data";
import { ApproveForm } from "./approve-form";

export default function ApprovalsPage() {
  // Twin of requireHouseTasksAdmin(): everyone else goes back to /house-tasks.
  const me = useRequireAccess(
    (p) => p.is_admin || p.is_house_tasks_admin,
    "/house-tasks",
  );
  const q = usePendingApprovals(!!me);

  if (!me || !q.data) return <Loading />;
  const tasks = q.data;

  return (
    <div>
      <PageHeader
        title="Approve points"
        description="These tasks won't count toward the scoreboard until approved. Once approved, future recurrences don't need re-approval."
      />

      {!tasks.length ? (
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
              <ApproveForm taskId={task.id} currentPoints={task.points} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
