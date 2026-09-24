"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMe } from "@/lib/client/me";
import { useSyncedAction } from "@/lib/client/save";
import Loading from "../../../loading";
import { DiyTaskForm } from "../../diy-task-form";
import { DIY_KEYS, projectOptionsFrom, useDiyTasks } from "../../data";
import { updateDiyTask } from "./actions";
import { DeleteDiyTaskButton } from "./delete-diy-task-button";

export default function EditDiyTaskPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: me } = useMe();
  // The record comes from the cached list (same columns), so the form opens
  // instantly when arriving from the list.
  const tasks = useDiyTasks();
  const action = useSyncedAction(updateDiyTask.bind(null, id), [...DIY_KEYS]);

  const task = tasks.data?.find((t) => t.id === id);
  const canManage =
    !!me &&
    !!task &&
    (task.created_by === me.user.id || !!me.profile.is_admin || !!me.profile.is_kiosk);

  useEffect(() => {
    if (me && task && !canManage) router.replace("/diy-tasks");
  }, [me, task, canManage, router]);

  if (!me || !tasks.data) return <Loading />;

  if (!task) {
    // Might just be newer than the cached copy — wait for the refresh.
    if (tasks.isFetching) return <Loading />;
    return (
      <p className="text-sm text-neutral-500">
        That task wasn&apos;t found.{" "}
        <Link href="/diy-tasks" className="underline hover:text-neutral-900">
          Back to DIY tasks
        </Link>
      </p>
    );
  }

  if (!canManage) return <Loading />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Edit {task.title}
      </h1>
      <DiyTaskForm
        action={action}
        defaultValues={{
          title: task.title,
          project: task.project,
          notes: task.notes,
          hours_estimate: task.hours_estimate,
        }}
        submitLabel="Save changes"
        projectOptions={projectOptionsFrom(tasks.data)}
      />
      <div className="mt-6 border-t border-neutral-200 pt-4">
        <DeleteDiyTaskButton taskId={task.id} isKiosk={!!me.profile.is_kiosk} />
      </div>
    </div>
  );
}
