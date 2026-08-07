"use client";

import { useState, useTransition } from "react";
import type { Category } from "@/lib/types";
import { MealForm } from "../meal-form";
import { createMeal } from "./actions";
import { extractRecipeFromUrl, type ExtractedRecipe } from "./extract-recipe";

export function NewMealClient({ categories }: { categories: Category[] }) {
  const [importUrl, setImportUrl] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ExtractedRecipe | null>(null);
  const [importing, startImporting] = useTransition();

  function handleImport() {
    setImportError(null);
    startImporting(async () => {
      const result = await extractRecipeFromUrl(importUrl);
      if ("error" in result) {
        setImportError(result.error);
      } else {
        setDraft(result.data);
      }
    });
  }

  return (
    <div>
      <div className="mb-6 rounded-md border border-dashed border-neutral-300 p-3">
        <label
          htmlFor="import_url"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Import from a recipe URL (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="import_url"
            type="url"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="https://example.com/some-recipe"
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={handleImport}
            disabled={importing || !importUrl.trim()}
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
          >
            {importing ? "Importing…" : "Import"}
          </button>
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Works on sites that publish structured recipe data — most recipe
          blogs do, since it&apos;s how they show up in Google. Not every
          site has it; you&apos;ll get a clear message if this one
          doesn&apos;t.
        </p>
        {importError && (
          <p className="mt-2 text-sm text-red-600">{importError}</p>
        )}
        {draft && (
          <p className="mt-2 text-sm text-green-700">
            Imported &quot;{draft.title}&quot; below — review everything
            before saving in case anything didn&apos;t come through cleanly.
          </p>
        )}
      </div>

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
