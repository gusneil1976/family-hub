import { notFound } from "next/navigation";
import { requireBakingAccess } from "@/lib/auth";
import type { BakingTemplate, BakingTemplateStep } from "@/lib/types";
import { TemplateForm } from "../../template-form";
import { updateTemplate } from "./actions";
import { DeleteTemplateButton } from "./delete-template-button";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireBakingAccess();

  const { data: template } = await supabase
    .from("baking_templates")
    .select("*")
    .eq("id", id)
    .single<BakingTemplate>();

  if (!template) {
    notFound();
  }

  const { data: steps } = await supabase
    .from("baking_template_steps")
    .select("*")
    .eq("template_id", id)
    .order("sort_order")
    .returns<BakingTemplateStep[]>();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Edit {template.name}
      </h1>
      <TemplateForm
        action={updateTemplate.bind(null, template.id)}
        defaultValues={{
          name: template.name,
          steps: (steps ?? []).map((s) => ({
            offset_days: s.offset_days,
            label: s.label,
          })),
        }}
        submitLabel="Save changes"
      />
      <div className="mt-6 border-t border-neutral-200 pt-4">
        <DeleteTemplateButton templateId={template.id} />
      </div>
    </div>
  );
}
