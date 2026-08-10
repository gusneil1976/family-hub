import { requireBakingAccess } from "@/lib/auth";
import type { BakingTemplate } from "@/lib/types";
import { ProjectForm } from "../project-form";
import { createProject } from "./actions";

export default async function NewProjectPage() {
  const { supabase } = await requireBakingAccess();

  const { data: templates } = await supabase
    .from("baking_templates")
    .select("*")
    .order("name")
    .returns<BakingTemplate[]>();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        New project
      </h1>
      <ProjectForm
        action={createProject}
        submitLabel="Create project"
        templates={templates ?? []}
      />
    </div>
  );
}
