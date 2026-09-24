"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMe } from "@/lib/client/me";
import { useSyncedAction } from "@/lib/client/save";
import Loading from "../../../loading";
import { TaskForm } from "../../task-form";
import { TASK_KEYS, useFamily, useTask } from "../../data";
import { ActiveToggle } from "./active-toggle";
import { updateTask } from "./actions";
import { DeleteTaskButton } from "./delete-task-button";

export default function EditTaskPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: me } = useMe();
  const task = useTask(id);
  const profiles = useFamily();
  // updateTask redirects back to the list; re-syncing first means the
  // edit is already showing when it lands.
  const action = useSyncedAction(updateTask.bind(null, id), [...TASK_KEYS]);

  const t = task.data;
  const canEdit =
    !!me &&
    !!t &&
    (t.created_by === me.user.id ||
      me.profile.is_admin ||
      me.profile.is_house_tasks_admin ||
      me.profile.is_kiosk);
  const forbidden = !!me && !!t && !canEdit;

  useEffect(() => {
    if (forbidden) router.replace("/house-tasks");
  }, [forbidden, router]);

  if (!me || task.data === undefined || !profiles.data || forbidden)
    return <Loading />;

  if (!t) {
    return (
      <div>
        <p className="text-sm text-neutral-500">Task not found.</p>
        <Link
          href="/house-tasks"
          className="mt-2 inline-block text-sm text-accent underline"
        >
          Back to tasks
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Edit task
      </h1>
      <TaskForm
        action={action}
        profiles={profiles.data}
        currentUserId={me.user.id}
        task={t}
        submitLabel="Save changes"
      />
      <div className="mt-6 flex items-center gap-4 border-t border-neutral-200 pt-4">
        <ActiveToggle taskId={t.id} isActive={t.is_active} />
        <DeleteTaskButton taskId={t.id} isKiosk={!!me.profile.is_kiosk} />
      </div>
    </div>
  );
}
