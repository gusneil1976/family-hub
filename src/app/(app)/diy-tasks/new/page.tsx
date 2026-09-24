"use client";

import { useMe } from "@/lib/client/me";
import { useSyncedAction } from "@/lib/client/save";
import Loading from "../../loading";
import { useFamily } from "../../house-tasks/data";
import { DiyTaskForm } from "../diy-task-form";
import { DIY_KEYS, projectOptionsFrom, useDiyTasks } from "../data";
import { createDiyTask } from "./actions";

export default function NewDiyTaskPage() {
  const { data: me } = useMe();
  const isKiosk = !!me?.profile.is_kiosk;
  const tasks = useDiyTasks();
  // Kiosk has no personal identity, so the form asks who's creating it.
  const family = useFamily(isKiosk);
  // createDiyTask redirects to the list, which then already shows the new task.
  const action = useSyncedAction(createDiyTask, [...DIY_KEYS]);

  if (!me || !tasks.data || (isKiosk && !family.data)) return <Loading />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        New DIY task
      </h1>
      <DiyTaskForm
        action={action}
        submitLabel="Create"
        projectOptions={projectOptionsFrom(tasks.data)}
        kioskProfiles={isKiosk ? family.data : undefined}
      />
    </div>
  );
}
