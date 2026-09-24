"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSyncedAction } from "@/lib/client/save";
import { useRequireAccess } from "@/lib/client/me";
import Loading from "../../../../loading";
import { useTemplate } from "../../../data";
import { TemplateForm } from "../../template-form";
import { updateTemplate } from "./actions";
import { DeleteTemplateButton } from "./delete-template-button";

export default function EditTemplatePage() {
  const { id } = useParams<{ id: string }>();
  const me = useRequireAccess((p) => p.has_baking_access);
  const detail = useTemplate(id);
  const action = useSyncedAction(updateTemplate.bind(null, id), [["curing-templates"]]);

  if (!me || !detail.data) return <Loading />;

  const { template, steps } = detail.data;

  if (!template) {
    return (
      <div>
        <p className="mb-4 text-sm text-neutral-500">Template not found.</p>
        <Link
          href="/curing/templates"
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          ← All templates
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Edit {template.name}
      </h1>
      <TemplateForm
        action={action}
        defaultValues={{
          name: template.name,
          steps: steps.map((s) => ({
            offset_value: s.offset_value,
            offset_unit: s.offset_unit,
            relative_to_previous: s.relative_to_previous,
            label: s.label,
            recurrence_interval_value: s.recurrence_interval_value,
            recurrence_interval_unit: s.recurrence_interval_unit,
            recurrence_count: s.recurrence_count,
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
