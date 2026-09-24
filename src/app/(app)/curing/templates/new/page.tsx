"use client";

import { useSyncedAction } from "@/lib/client/save";
import { useRequireAccess } from "@/lib/client/me";
import Loading from "../../../loading";
import { TemplateForm } from "../template-form";
import { createTemplate } from "./actions";

export default function NewTemplatePage() {
  const me = useRequireAccess((p) => p.has_baking_access);
  // So the list it redirects to already shows the new template.
  const action = useSyncedAction(createTemplate, [["curing-templates"]]);

  if (!me) return <Loading />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        New template
      </h1>
      <TemplateForm action={action} submitLabel="Create template" />
    </div>
  );
}
