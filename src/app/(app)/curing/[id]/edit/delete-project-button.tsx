"use client";

import { useRouter } from "next/navigation";
import { patch, useSave } from "@/lib/client/save";
import { PROJECTS, projectKey, UPCOMING_STEPS, type ProjectRow } from "../../data";
import type { DueBakingStep } from "../../get-due-steps";
import { deleteProject } from "./actions";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const save = useSave();
  const router = useRouter();

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (
            !confirm(
              "Delete this project? Its steps will be deleted too. This can't be undone.",
            )
          )
            return;
          // Straight back to the list with the project already gone; if the
          // server refuses, it reappears there with an error toast.
          void save(() => deleteProject(projectId), {
            keys: [["curing-projects"], projectKey(projectId), ["baking-steps"]],
            optimistic: (qc) => {
              patch<ProjectRow[]>(qc, PROJECTS, (rows) =>
                rows.filter((p) => p.id !== projectId),
              );
              patch<DueBakingStep[]>(qc, UPCOMING_STEPS, (steps) =>
                steps.filter((s) => s.project?.id !== projectId),
              );
            },
          });
          router.push("/curing");
        }}
        className="text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
      >
        Delete project
      </button>
    </div>
  );
}
