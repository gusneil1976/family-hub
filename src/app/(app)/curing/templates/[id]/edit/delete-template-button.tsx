"use client";

import { useRouter } from "next/navigation";
import { patch, useSave } from "@/lib/client/save";
import { TEMPLATES, type TemplateRow } from "../../../data";
import { deleteTemplate } from "./actions";

export function DeleteTemplateButton({ templateId }: { templateId: string }) {
  const save = useSave();
  const router = useRouter();

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (!confirm("Delete this template? This can't be undone.")) return;
          // Straight back to the list with the template already gone; if the
          // server refuses, it reappears there with an error toast.
          void save(() => deleteTemplate(templateId), {
            keys: [["curing-templates"]],
            optimistic: (qc) =>
              patch<TemplateRow[]>(qc, TEMPLATES, (rows) =>
                rows.filter((t) => t.id !== templateId),
              ),
          });
          router.push("/curing/templates");
        }}
        className="text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
      >
        Delete template
      </button>
    </div>
  );
}
