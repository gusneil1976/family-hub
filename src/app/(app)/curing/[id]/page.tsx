import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBakingAccess } from "@/lib/auth";
import type { BakingProject, BakingProjectStep } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { AddStepForm } from "./add-step-form";
import { ProjectWeights } from "./project-weights";
import { SaveAsTemplateForm } from "./save-as-template-form";
import { StepRow } from "./step-row";

export default async function ProjectDetailPage({
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

  const { data: steps } = await supabase
    .from("baking_project_steps")
    .select("*")
    .eq("project_id", id)
    .order("due_date")
    .returns<BakingProjectStep[]>();

  const all = steps ?? [];

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
