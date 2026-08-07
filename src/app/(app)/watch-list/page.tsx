import { Film } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export default async function WatchListPage() {
  await requireUser();

  return (
    <div>
      <PageHeader title="TV Shows/Movies" />

      <Card className="flex flex-col items-center py-12 text-center">
        <Film className="h-8 w-8 text-accent" />
        <p className="mt-3 font-medium text-foreground">Coming soon</p>
        <p className="mt-1 max-w-sm text-sm text-neutral-500">
          Submit and vote on TV shows and movies for family watching time —
          check back once it&apos;s built.
        </p>
      </Card>
    </div>
  );
}
