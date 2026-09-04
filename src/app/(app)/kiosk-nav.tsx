"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Film,
  Home,
  ListChecks,
  LogOut,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";
import { signOut, stopKioskPreview } from "./actions";
import { HOUSE_TASKS_NAV, MEAL_VOTE_NAV, type IconType, type NavItem } from "./nav-items";

const APPS: { label: string; href: string; icon: IconType; match: (p: string) => boolean }[] = [
  {
    label: "Meals",
    href: "/meal-vote",
    icon: UtensilsCrossed,
    match: (p) => p.startsWith("/meal-vote"),
  },
  {
    label: "House Tasks",
    href: "/house-tasks",
    icon: ListChecks,
    match: (p) => p.startsWith("/house-tasks"),
  },
  {
    label: "TV Shows/Movies",
    href: "/watch-list",
    icon: Film,
    match: (p) => p.startsWith("/watch-list"),
  },
  {
    label: "DIY Tasks",
    href: "/diy-tasks",
    icon: Wrench,
    match: (p) => p.startsWith("/diy-tasks"),
  },
];

function AppTile({
  href,
  active,
  icon: Icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: IconType;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-1 flex-col items-center justify-center gap-1.5 py-4 text-center transition-colors ${
        active
          ? "bg-accent text-accent-foreground"
          : "text-sidebar-foreground hover:bg-white/10"
      }`}
    >
      <Icon className="h-8 w-8" />
      <span className="text-base font-semibold">{label}</span>
    </Link>
  );
}

function SubTab({
  href,
  active,
  icon: Icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: IconType;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-base font-medium transition-colors ${
        active
          ? "bg-accent text-accent-foreground"
          : "bg-white/10 text-sidebar-foreground hover:bg-white/20"
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}

// Top-bar shell for the shared kiosk login, replacing Sidebar entirely —
// touch-first (big tiles, no hamburger/collapse) since this runs on a
// fridge touchscreen. Row 1 is always the same 4 apps; row 2 is a
// "sub-selectable" tab strip for whichever app (if any) has sub-pages.
export function KioskNav({ isPreviewingKiosk }: { isPreviewingKiosk?: boolean }) {
  const pathname = usePathname();

  const subNav: NavItem[] = pathname.startsWith("/meal-vote")
    ? MEAL_VOTE_NAV
    : pathname.startsWith("/house-tasks")
      ? HOUSE_TASKS_NAV
      : [];

  return (
    <div className="bg-sidebar text-sidebar-foreground print:hidden">
      {isPreviewingKiosk && (
        <div className="flex items-center justify-between gap-3 bg-amber-400 px-4 py-2 text-amber-950">
          <span className="text-sm font-semibold">
            Previewing the kiosk view — nobody else sees this
          </span>
          <form action={stopKioskPreview}>
            <button
              type="submit"
              className="rounded-md bg-amber-950 px-3 py-1.5 text-sm font-medium text-amber-50 hover:bg-amber-900"
            >
              Exit preview
            </button>
          </form>
        </div>
      )}
      <div className="flex items-center justify-between px-4 pt-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold text-white"
        >
          <Home className="h-6 w-6 text-accent" />
          Family Hub
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-sidebar-muted hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>

      <nav className="mt-2 flex">
        {APPS.map((app) => (
          <AppTile
            key={app.href}
            href={app.href}
            active={app.match(pathname)}
            icon={app.icon}
            label={app.label}
          />
        ))}
      </nav>

      {subNav.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3">
          {subNav.map((item) => (
            <SubTab
              key={item.href}
              href={item.href}
              active={item.match(pathname)}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </div>
      )}
    </div>
  );
}
