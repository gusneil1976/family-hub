"use client";

import { useSyncedAction } from "@/lib/client/save";
import { useRequireAccess } from "@/lib/client/me";
import Loading from "../../loading";
import { useTemplates } from "../data";
import { ProjectForm } from "../project-form";
import { createProject } from "./actions";

export default function NewProjectPage() {
  const me = useRequireAccess((p) => p.has_baking_access);
  const templates = useTemplates();
  // Refresh the project list (and the Tasks calendar, for template steps)
  // before landing on the new project.
  const action = useSyncedAction(createProject, [["curing-projects"], ["baking-steps"]]);

  if (!me || !templates.data) return <Loading />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        New project
      </h1>
      <ProjectForm
        action={action}
        submitLabel="Create project"
        templates={templates.data}
      />
    </div>
  );
}
