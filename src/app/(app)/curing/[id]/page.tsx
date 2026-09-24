"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { useRequireAccess } from "@/lib/client/me";
import Loading from "../../loading";
import { useProject } from "../data";
import { AddStepForm } from "./add-step-form";
import { ProjectWeights } from "./project-weights";
import { SaveAsTemplateForm } from "./save-as-template-form";
import { StepRow } from "./step-row";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const me = useRequireAccess((p) => p.has_baking_access);
  const detail = useProject(id);

  if (!me || !detail.data) return <Loading />;

  const { project, steps: all } = detail.data;

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
      <p className="mb-4 text-sm">
        <Link href="/curing" className="text-neutral-500 hover:text-neutral-900">
          ← All projects
        </Link>
      </p>

      <PageHeader
        title={project.name}
        description={`Started ${project.start_date}`}
        action={
          <Link
            href={`/curing/${project.id}/edit`}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Edit
          </Link>
        }
      />

      <ProjectWeights
        projectId={project.id}
        initialWeight={project.initial_weight}
        targetWeight={project.target_weight}
      />

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">Steps</h2>
        {all.length === 0 ? (
          <p className="mb-3 text-sm text-neutral-500">No steps yet.</p>
        ) : (
          <ul className="mb-3 divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
            {all.map((step) => (
              <StepRow key={step.id} projectId={project.id} step={step} />
            ))}
          </ul>
        )}
        <AddStepForm projectId={project.id} />
      </section>

      <SaveAsTemplateForm projectId={project.id} />
    </div>
  );
}
