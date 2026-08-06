"use client";

import { useActionState, useState } from "react";
import type { Category, Ingredient, Meal } from "@/lib/types";
import { MealImage } from "./meal-image";
import { parseIngredientLine } from "./parse-bulk-ingredient-line";

export type MealFormState = { error: string } | undefined;

type IngredientRow = { name: string; quantity: string; unit: string };

const EMPTY_ROW: IngredientRow = { name: "", quantity: "", unit: "" };

export function MealForm({
  action,
  meal,
  ingredients,
  categories,
  submitLabel,
}: {
  action: (
    state: MealFormState,
    formData: FormData,
  ) => Promise<MealFormState>;
  meal?: Meal;
  ingredients?: Ingredient[];
  categories: Category[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [rows, setRows] = useState<IngredientRow[]>(
    ingredients?.length
      ? ingredients.map((i) => ({
          name: i.name,
          quantity: i.quantity ?? "",
          unit: i.unit ?? "",
        }))
      : [EMPTY_ROW],
  );

  function updateRow(index: number, patch: Partial<IngredientRow>) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setRows((prev) => [...prev, EMPTY_ROW]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  const [bulkText, setBulkText] = useState("");

  function addBulkLines() {
    const lines = bulkText
      .split("\n")
      .map((line) => line.replace(/^[•\-*]\s*/, "").trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    setRows((prev) => {
      const existing = prev.filter(
        (row) => row.name.trim() || row.quantity.trim() || row.unit.trim(),
      );
      return [...existing, ...lines.map(parseIngredientLine)];
    });
    setBulkText("");
  }

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Meal name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={meal?.name}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="servings"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Servings (optional)
        </label>
        <input
          id="servings"
          name="servings"
          type="number"
          min={1}
          defaultValue={meal?.servings ?? undefined}
          className="w-32 rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="source_url"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Source URL (optional)
        </label>
        <input
          id="source_url"
          name="source_url"
          type="url"
          placeholder="https://..."
          defaultValue={meal?.source_url ?? ""}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="category_id"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Category
        </label>
        <select
          id="category_id"
          name="category_id"
          defaultValue={meal?.category_id ?? ""}
          className="w-full max-w-xs rounded-md border border-neutral-300 bg-white px-3 py-2 text-base focus:border-accent focus:outline-none"
        >
          <option value="">No category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-sm text-neutral-700">
          <input
            type="checkbox"
            name="excluded_from_voting"
            defaultChecked={meal?.excluded_from_voting ?? false}
            className="h-4 w-4"
          />
          Exclude from voting (never include this meal in a shortlist draw)
        </label>
      </div>

      <div>
        <label
          htmlFor="image"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Photo (optional)
        </label>
        {meal?.image_url && (
          <div className="mb-2 flex items-center gap-3">
            <MealImage
              src={meal.image_url}
              alt=""
              className="h-20 w-20 rounded-md object-cover"
            />
            <label className="flex items-center gap-1.5 text-sm text-neutral-700">
              <input type="checkbox" name="remove_image" className="h-4 w-4" />
              Remove current photo
            </label>
          </div>
        )}
        <input
          id="image"
          name="image"
          type="file"
          accept="image/*"
          className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded-md file:border file:border-neutral-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-50"
        />
      </div>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-neutral-700">
          Ingredients
        </legend>

        <div className="mb-3 rounded-md border border-dashed border-neutral-300 p-3">
          <label
            htmlFor="bulk_ingredients"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Paste a list (one ingredient per line)
          </label>
          <textarea
            id="bulk_ingredients"
            rows={4}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={
              "2 tbsp runny honey\n4 tbsp soy sauce\n1 lime, zest and juice"
            }
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={addBulkLines}
            disabled={!bulkText.trim()}
            className="mt-2 rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            Add as ingredients
          </button>
        </div>

        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2">
              <input
                name="ingredient_name"
                placeholder="Ingredient"
                value={row.name}
                onChange={(e) => updateRow(i, { name: e.target.value })}
                className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
              <input
                name="ingredient_quantity"
                placeholder="Qty"
                value={row.quantity}
                onChange={(e) => updateRow(i, { quantity: e.target.value })}
                className="w-20 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
              <input
                name="ingredient_unit"
                placeholder="Unit"
                value={row.unit}
                onChange={(e) => updateRow(i, { unit: e.target.value })}
                className="w-20 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                disabled={rows.length === 1}
                className="rounded-md px-2 text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
                aria-label="Remove ingredient"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRow}
          className="mt-2 text-sm font-medium text-neutral-700 hover:text-neutral-900"
        >
          + Add ingredient
        </button>
      </fieldset>

      <div>
        <label
          htmlFor="recipe_body"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Recipe
        </label>
        <textarea
          id="recipe_body"
          name="recipe_body"
          rows={8}
          defaultValue={meal?.recipe_body ?? ""}
          placeholder="Steps to cook this meal…"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="notes"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={meal?.notes ?? ""}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
