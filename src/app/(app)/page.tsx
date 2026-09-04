import Link from "next/link";
import {
  ChefHat,
  Film,
  ListChecks,
  Plane,
  Sparkles,
  UtensilsCrossed,
  Wallet,
  Wrench,
} from "lucide-react";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

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
  {
    name: "TV Shows/Movies",
    description: "Suggest what to watch next and track what you've seen.",
    href: "/watch-list",
    icon: Film,
  },
  {
    name: "DIY Tasks",
    description: "Track home-improvement projects and progress.",
    href: "/diy-tasks",
    icon: Wrench,
  },
];

export default async function HubPage() {
  const { profile } = await requireUser();

  const apps = [...APPS];
  if (profile?.has_spend_tracker_access) {
    apps.push({
      name: "Spend Tracker",
      description: "Track current-account spending by category.",
      href: "/spend-tracker",
      icon: Wallet,
    });
  }
  if (profile?.has_mini_breaks_access) {
    apps.push({
      name: "Mini Breaks",
      description: "Plan trip ideas — dates, links, and travel documents.",
      href: "/mini-breaks",
      icon: Plane,
    });
  }
  if (profile?.has_baking_access) {
    apps.push({
      name: "Curing Projects",
      description: "Track multi-step baking and curing projects over time.",
      href: "/curing",
      icon: ChefHat,
    });
  }

  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-3xl font-extrabold sm:text-4xl">
        <Sparkles className="sparkle-icon h-7 w-7 shrink-0 text-amber-400" />
        <span className="sparkle-text">Happy 50th Birthday Anna</span>
        <Sparkles
          className="sparkle-icon h-7 w-7 shrink-0 text-amber-400"
          style={{ animationDelay: "0.5s" }}
        />
      </p>

      <PageHeader
        title="Welcome to the Neil Family Hub"
        description="Choose an app."
      />

      {profile?.is_kiosk ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {apps.map((app) => (
            <Link
              key={app.href}
              href={app.href}
              className="group flex items-center gap-5 rounded-2xl border-2 border-card-border bg-card p-7 shadow-sm transition-colors hover:border-accent"
            >
              <app.icon className="h-14 w-14 shrink-0 text-accent" />
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {app.name}
                </h2>
                <p className="mt-1 text-base text-neutral-500">
                  {app.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {apps.map((app) => (
            <Link
              key={app.href}
              href={app.href}
              className="group rounded-xl border border-card-border bg-card p-5 shadow-sm transition-colors hover:border-accent"
            >
              <div className="flex items-start justify-between">
                <app.icon className="h-6 w-6 text-accent" />
              </div>
              <h2 className="mt-3 font-semibold text-foreground">
                {app.name}
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                {app.description}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
