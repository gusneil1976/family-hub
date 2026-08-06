import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { MealList, type MealRow } from "./meal-list";

export default async function MealsPage() {
  const { supabase, profile } = await requireUser();

  const { data: meals } = await supabase
    .from("meals")
    .select("*, categories(name)")
    .order("name")
    .returns<MealRow[]>();

  return (
    <div>
      <PageHeader
        title="Meal library"
        action={
          profile?.is_admin && (
            <Link
              href="/meal-vote/meals/new"
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
            >
              Add meal
            </Link>
          )
        }
      />

      {!meals?.length ? (
        <p className="text-sm text-neutral-500">
          No meals yet.{" "}
          {profile?.is_admin
            ? "Add your first meal to get started."
            : "Check back once the admin has added some."}
        </p>
      ) : (
        <MealList meals={meals} />
      )}
    </div>
  );
}
