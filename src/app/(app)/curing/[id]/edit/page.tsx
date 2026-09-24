"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSyncedAction } from "@/lib/client/save";
import { useRequireAccess } from "@/lib/client/me";
import Loading from "../../../loading";
import { projectKey, useProject } from "../../data";
import { ProjectForm } from "../../project-form";
import { updateProject } from "./actions";
import { DeleteProjectButton } from "./delete-project-button";

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const me = useRequireAccess((p) => p.has_baking_access);
  const detail = useProject(id);
  // The name also shows on the list and the Tasks calendar.
  const action = useSyncedAction(updateProject.bind(null, id), [
    projectKey(id),
    ["curing-projects"],
    ["baking-steps"],
  ]);

  if (!me || !detail.data) return <Loading />;

  const { project } = detail.data;

  if (!project) {
    return (
      <div>
        <p className="mb-4 text-sm text-neutral-500">Project not found.</p>
        <Link href="/curing" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← All projects
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Edit {project.name}
      </h1>
      <ProjectForm
        action={action}
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
