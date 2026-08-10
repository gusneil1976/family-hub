import { requireMiniBreaksAccess } from "@/lib/auth";
import type { MiniBreakUrlCategory } from "@/lib/types";
import { CategoryForm } from "./category-form";
import { DeleteCategoryButton } from "./delete-category-button";

export default async function MiniBreakCategoriesPage() {
  const { supabase } = await requireMiniBreaksAccess();

  const { data: categories } = await supabase
    .from("mini_break_url_categories")
    .select("*")
    .order("name")
    .returns<MiniBreakUrlCategory[]>();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Link categories
      </h1>

      <div className="mb-6">
        <CategoryForm />
      </div>

      {categories?.length ? (
        <ul className="divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
          {categories.map((category) => (
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
