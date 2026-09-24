"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { useMe } from "@/lib/client/me";
import Loading from "../../loading";
import { useMeals } from "../data";
import { ImportFromUrlBox } from "./import-from-url-box";
import { MealList } from "./meal-list";

export default function MealsPage() {
  const { data: me } = useMe();
  const mealsQuery = useMeals();

  if (!me || !mealsQuery.data) return <Loading />;

  const profile = me.profile;
  const meals = mealsQuery.data;

  return (
    <div>
      <PageHeader
        title="Meal library"
        action={
          profile?.is_admin && (
            <div className="flex items-center gap-3">
              <Link
                href="/meal-vote/admin/categories"
                className="text-sm text-neutral-500 underline hover:text-neutral-900"
              >
                Manage categories
              </Link>
              <Link
                href="/meal-vote/meals/new"
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
              >
                Add meal
              </Link>
            </div>
          )
        }
      />

      {profile?.is_admin && <ImportFromUrlBox />}

      {!meals?.length ? (
        <p className="text-sm text-neutral-500">
          No meals yet.{" "}
          {profile?.is_admin
            ? "Add your first meal to get started."
            : "Check back once the admin has added some."}
        </p>
      ) : (
        <MealList meals={meals} isAdmin={!!profile?.is_admin} />
      )}
    </div>
  );
}
