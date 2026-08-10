import { requireUser } from "@/lib/auth";
import type { Profile } from "@/lib/types";
import { TaskForm } from "../task-form";
import { createTask } from "./actions";

export default async function NewTaskPage() {
  const { supabase, user, profile } = await requireUser();

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
        New task
      </h1>
      <TaskForm
        action={createTask}
        profiles={profiles ?? []}
        currentUserId={user.id}
        submitLabel="Create task"
        isKiosk={!!profile?.is_kiosk}
      />
    </div>
  );
}
