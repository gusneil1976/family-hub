import Link from "next/link";
import { requireBakingAccess } from "@/lib/auth";
import type { BakingTemplate } from "@/lib/types";
import { PageHeader } from "@/components/ui";

type TemplateRow = BakingTemplate & { steps: { count: number }[] };

export default async function TemplatesPage() {
  const { supabase } = await requireBakingAccess();

  const { data: templates } = await supabase
    .from("baking_templates")
    .select("*, steps:baking_template_steps(count)")
    .order("name")
    .returns<TemplateRow[]>();

  const all = templates ?? [];

  return (
    <div>
      <PageHeader
        title="Templates"
        description="Reusable step schedules to import into a new project."
        action={
          <Link
            href="/curing/templates/new"
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            New template
          </Link>
        }
      />

      {all.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No templates yet — add one to reuse across projects.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
          {all.map((template) => (
            <li key={template.id}>
              <Link
                href={`/curing/templates/${template.id}/edit`}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-neutral-50"
              >
                <span className="font-medium text-neutral-900">
                  {template.name}
                </span>
                <span className="text-neutral-500">
                  {template.steps[0]?.count ?? 0} step
                  {(template.steps[0]?.count ?? 0) === 1 ? "" : "s"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
