import { TemplateForm } from "../template-form";
import { createTemplate } from "./actions";

export default function NewTemplatePage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        New template
      </h1>
      <TemplateForm action={createTemplate} submitLabel="Create template" />
    </div>
  );
}
