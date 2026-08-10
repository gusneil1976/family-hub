import { requireUser } from "@/lib/auth";
import type { Profile } from "@/lib/types";
import { DiyTaskForm } from "../diy-task-form";
import { createDiyTask } from "./actions";

export default async function NewDiyTaskPage() {
  const { supabase, profile } = await requireUser();

  const { data: rows } = await supabase
    .from("diy_tasks")
    .select("project")
    .not("project", "is", null)
    .order("project");

  const projectOptions = Array.from(
    new Set((rows ?? []).map((r) => r.project).filter((p): p is string => !!p)),
  );

  const { data: kioskProfiles } = profile?.is_kiosk
    ? await supabase
        .from("profiles")
        .select("*")
        .eq("is_archived", false)
        .eq("is_kiosk", false)
        .order("display_name")
        .returns<Profile[]>()
    : { data: null };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        New DIY task
      </h1>
      <DiyTaskForm
        action={createDiyTask}
        submitLabel="Create"
        projectOptions={projectOptions}
        kioskProfiles={kioskProfiles ?? undefined}
      />
    </div>
  );
}
