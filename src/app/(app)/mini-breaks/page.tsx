import { Plane } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { requireMiniBreaksAccess } from "@/lib/auth";

export default async function MiniBreaksPage() {
  await requireMiniBreaksAccess();

  return (
    <div>
      <PageHeader title="Mini Breaks" />

      <Card className="flex flex-col items-center py-12 text-center">
        <Plane className="h-8 w-8 text-accent" />
        <p className="mt-3 font-medium text-foreground">Coming soon</p>
        <p className="mt-1 max-w-sm text-sm text-neutral-500">
          Mini break planning is on the way — check back once it&apos;s
          built.
        </p>
      </Card>
    </div>
  );
}
