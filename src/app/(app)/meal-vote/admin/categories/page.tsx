import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import type { Category } from "@/lib/types";
import { CategoryForm } from "./category-form";
import { DeleteCategoryButton } from "./delete-category-button";

export default async function CategoriesPage() {
  const { supabase } = await requireAdmin();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name")
    .returns<Category[]>();

  return (
    <div>
      <p className="mb-4 text-sm">
        <Link href="/meal-vote/admin/shortlist" className="underline">
          Back to shortlist
        </Link>
      </p>

      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Manage categories
      </h1>

      <div className="mb-6">
        <CategoryForm />
      </div>

      <ul className="divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
        {categories?.map((category) => (
          <li
            key={category.id}
            className="flex items-center justify-between px-4 py-2 text-sm"
          >
            <span>{category.name}</span>
            <DeleteCategoryButton categoryId={category.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
