import Link from "next/link";
import { Wallet } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { requireSpendTrackerAccess } from "@/lib/auth";

export default async function SpendTrackerPage() {
  await requireSpendTrackerAccess();

  return (
    <div>
      <p className="mb-4 text-sm">
        <Link href="/" className="text-neutral-500 hover:text-neutral-900">
          ← All apps
        </Link>
      </p>

      <PageHeader title="Spend Tracker" />

      <Card className="flex flex-col items-center py-12 text-center">
        <Wallet className="h-8 w-8 text-accent" />
        <p className="mt-3 font-medium text-foreground">Coming soon</p>
        <p className="mt-1 max-w-sm text-sm text-neutral-500">
          Family spend tracking is on the way — check back once it&apos;s
          built.
        </p>
      </Card>
    </div>
  );
}
