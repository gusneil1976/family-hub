"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteTemplate } from "./actions";

export function DeleteTemplateButton({ templateId }: { templateId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm("Delete this template? This can't be undone.")) return;
          setError(null);
          startTransition(async () => {
            try {
              await deleteTemplate(templateId);
              router.push("/curing/templates");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed to delete.");
            }
          });
        }}
        className="text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
      >
        Delete template
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
