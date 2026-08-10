"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Category } from "@/lib/types";
import { MealForm } from "../meal-form";
import { createMeal } from "./actions";
import { extractRecipeFromUrl, type ExtractedRecipe } from "./extract-recipe";

export function NewMealClient({
  categories,
  initialUrl,
}: {
  categories: Category[];
  initialUrl?: string;
}) {
  const [importError, setImportError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ExtractedRecipe | null>(null);
  const [importing, startImporting] = useTransition();
  const triggered = useRef(false);

  useEffect(() => {
    if (!initialUrl || triggered.current) return;
    triggered.current = true;
    setImportError(null);
    startImporting(async () => {
      const result = await extractRecipeFromUrl(initialUrl);
      if ("error" in result) {
        setImportError(result.error);
      } else {
        setDraft(result.data);
      }
    });
  }, [initialUrl]);

  return (
    <div>
      {initialUrl && (
        <div className="mb-6 rounded-md border border-dashed border-neutral-300 p-3">
          {importing && (
            <p className="text-sm text-neutral-600">
              Importing recipe from {initialUrl}…
            </p>
          )}
          {importError && (
            <p className="text-sm text-red-600">{importError}</p>
          )}
          {draft && (
            <p className="text-sm text-green-700">
              Imported &quot;{draft.title}&quot; below — review everything
              before saving in case anything didn&apos;t come through
              cleanly.
            </p>
          )}
        </div>
      )}

      <MealForm
        key={draft?.source_url ?? "empty"}
        action={createMeal}
        categories={categories}
        submitLabel="Add meal"
        meal={
          draft
            ? {
                name: draft.title,
                servings: draft.servings ?? undefined,
                recipe_body: draft.recipe_body,
                notes: draft.notes,
                source_url: draft.source_url,
              }
            : undefined
        }
        ingredients={draft?.ingredients}
        externalImageUrl={draft?.image_url ?? undefined}
      />
    </div>
  );
}
