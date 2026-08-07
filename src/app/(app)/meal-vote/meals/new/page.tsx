import { requireAdmin } from "@/lib/auth";
import type { Category } from "@/lib/types";
import { NewMealClient } from "./new-meal-client";

export default async function NewMealPage() {
  const { supabase } = await requireAdmin();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name")
    .returns<Category[]>();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Add a meal
      </h1>
      <NewMealClient categories={categories ?? []} />
    </div>
  );
}
