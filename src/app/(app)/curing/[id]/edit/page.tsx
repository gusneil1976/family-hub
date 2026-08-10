import { notFound } from "next/navigation";
import { requireBakingAccess } from "@/lib/auth";
import type { BakingProject } from "@/lib/types";
import { ProjectForm } from "../../project-form";
import { updateProject } from "./actions";
import { DeleteProjectButton } from "./delete-project-button";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireBakingAccess();

  const { data: project } = await supabase
    .from("baking_projects")
    .select("*")
    .eq("id", id)
    .single<BakingProject>();

  if (!project) {
    notFound();
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Edit {project.name}
      </h1>
      <ProjectForm
        action={updateProject.bind(null, project.id)}
        defaultValues={{
          name: project.name,
          start_date: project.start_date,
          initial_weight: project.initial_weight,
          target_weight: project.target_weight,
        }}
        submitLabel="Save changes"
      />
      <div className="mt-6 border-t border-neutral-200 pt-4">
        <DeleteProjectButton projectId={project.id} />
      </div>
    </div>
  );
}
