import Link from "next/link";

/** Shown for a meal that doesn't exist (or has just been deleted). */
export function MealNotFound() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-foreground">Not found</h1>
      <p className="text-sm text-neutral-500">
        That meal doesn&apos;t exist any more.{" "}
        <Link href="/meal-vote/meals" className="underline">
          Back to the meal library
        </Link>
      </p>
    </div>
  );
}
