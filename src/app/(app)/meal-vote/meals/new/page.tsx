"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRequireAccess } from "@/lib/client/me";
import Loading from "../../../loading";
import { useMealCategories } from "../../data";
import { NewMealClient } from "./new-meal-client";

// useSearchParams() needs a Suspense boundary above it.
export default function NewMealPage() {
  return (
    <Suspense fallback={<Loading />}>
      <NewMeal />
    </Suspense>
  );
}

function NewMeal() {
  const me = useRequireAccess((p) => p.is_admin);
  const url = useSearchParams().get("url") ?? undefined;
  const categories = useMealCategories();

  if (!me || !categories.data) return <Loading />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Add a meal
      </h1>
      <NewMealClient categories={categories.data} initialUrl={url} />
    </div>
  );
}
