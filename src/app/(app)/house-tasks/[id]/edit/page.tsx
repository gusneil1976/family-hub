import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import type { Profile, Task } from "@/lib/types";
import { TaskForm } from "../../task-form";
import { ActiveToggle } from "./active-toggle";
import { updateTask } from "./actions";
import { DeleteTaskButton } from "./delete-task-button";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user, profile } = await requireUser();

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single<Task>();

  if (!task) {
    notFound();
  }

  const canEdit =
    task.created_by === user.id ||
    profile?.is_admin ||
    profile?.is_house_tasks_admin ||
    profile?.is_kiosk;
  if (!canEdit) {
    redirect("/house-tasks");
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_archived", false)
    .eq("is_kiosk", false)
    .order("display_name")
    .returns<Profile[]>();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Edit task
      </h1>
      <TaskForm
        action={updateTask.bind(null, task.id)}
        profiles={profiles ?? []}
        currentUserId={user.id}
        task={task}
        submitLabel="Save changes"
      />
      <div className="mt-6 flex items-center gap-4 border-t border-neutral-200 pt-4">
        <ActiveToggle taskId={task.id} isActive={task.is_active} />
        <DeleteTaskButton taskId={task.id} isKiosk={!!profile?.is_kiosk} />
      </div>
    </div>
  );
}
