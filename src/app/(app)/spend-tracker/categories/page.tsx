"use client";

import { useRequireAccess } from "@/lib/client/me";
import Loading from "../../loading";
import { useSpendCategories } from "../data";
import { CategoryForm } from "./category-form";
import { DeleteCategoryButton } from "./delete-category-button";

export default function SpendCategoriesPage() {
  const me = useRequireAccess((p) => p.has_spend_tracker_access);
  const categories = useSpendCategories();

  if (!me || !categories.data) return <Loading />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">Categories</h1>

      <div className="mb-6">
        <CategoryForm />
      </div>

      {categories.data.length ? (
        <ul className="divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
          {categories.data.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between px-4 py-2 text-sm"
            >
              <span>{category.name}</span>
              <DeleteCategoryButton categoryId={category.id} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-500">No categories yet.</p>
      )}
    </div>
  );
}
