import Link from "next/link";
import { ListChecks, UtensilsCrossed } from "lucide-react";
import { PageHeader } from "@/components/ui";

const APPS = [
  {
    name: "Meals",
    description:
      "Vote on this week's meal and manage the family recipe library.",
    href: "/meal-vote",
    icon: UtensilsCrossed,
  },
  {
    name: "House Tasks",
    description:
      "Create and complete chores, earn points, and check the scoreboard.",
    href: "/house-tasks",
    icon: ListChecks,
  },
];

export default function HubPage() {
  return (
    <div>
      <PageHeader
        title="Welcome to the Neil Family Hub"
        description="Choose an app."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {APPS.map((app) => (
          <Link
            key={app.href}
            href={app.href}
            className="group rounded-xl border border-card-border bg-card p-5 shadow-sm transition-colors hover:border-accent"
          >
            <app.icon className="h-6 w-6 text-accent" />
            <h2 className="mt-3 font-semibold text-foreground">
              {app.name}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {app.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
