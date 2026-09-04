import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import type { DiyTask } from "@/lib/types";
import { DiyTaskForm } from "../../diy-task-form";
import { updateDiyTask } from "./actions";
import { DeleteDiyTaskButton } from "./delete-diy-task-button";

export default async function EditDiyTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user, profile } = await requireUser();

  const { data: task } = await supabase
    .from("diy_tasks")
    .select("*")
    .eq("id", id)
    .single<DiyTask>();

  if (!task) {
    notFound();
  }

  const canManage =
    task.created_by === user.id || !!profile?.is_admin || !!profile?.is_kiosk;
  if (!canManage) {
    redirect("/diy-tasks");
  }

  const { data: rows } = await supabase
    .from("diy_tasks")
    .select("project")
    .not("project", "is", null)
    .order("project");

  const projectOptions = Array.from(
    new Set((rows ?? []).map((r) => r.project).filter((p): p is string => !!p)),
  );

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Edit {task.title}
      </h1>
      <DiyTaskForm
        action={updateDiyTask.bind(null, task.id)}
        defaultValues={{
          title: task.title,
          project: task.project,
          notes: task.notes,
          hours_estimate: task.hours_estimate,
        }}
        submitLabel="Save changes"
        projectOptions={projectOptions}
      />
      <div className="mt-6 border-t border-neutral-200 pt-4">
        <DeleteDiyTaskButton taskId={task.id} isKiosk={!!profile?.is_kiosk} />
      </div>
    </div>
  );
}
