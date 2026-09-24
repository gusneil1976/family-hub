"use client";

import { useMe } from "@/lib/client/me";
import { useSyncedAction } from "@/lib/client/save";
import Loading from "../../loading";
import { TaskForm } from "../task-form";
import { TASK_KEYS, useFamily } from "../data";
import { createTask } from "./actions";

export default function NewTaskPage() {
  const { data: me } = useMe();
  const profiles = useFamily();
  // createTask redirects back to the list; re-syncing first means the new
  // task is already there when it lands.
  const action = useSyncedAction(createTask, [...TASK_KEYS]);

  if (!me || !profiles.data) return <Loading />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        New task
      </h1>
      <TaskForm
        action={action}
        profiles={profiles.data}
        currentUserId={me.user.id}
        submitLabel="Create task"
        isKiosk={!!me.profile.is_kiosk}
      />
    </div>
  );
}
