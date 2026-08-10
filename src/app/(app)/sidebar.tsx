"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  CheckSquare,
  ChefHat,
  ClipboardCheck,
  Film,
  History,
  Home,
  ListChecks,
  ListTodo,
  LogOut,
  Menu,
  Palette,
  Plane,
  ShieldCheck,
  Tag,
  Target,
  Trophy,
  Upload,
  User,
  UtensilsCrossed,
  Users,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { signOut } from "./actions";

type IconType = React.ComponentType<{ className?: string }>;

type NavItem = {
  label: string;
  href: string;
  icon: IconType;
  match: (pathname: string) => boolean;
};

const exact = (href: string) => (pathname: string) => pathname === href;

const MEAL_VOTE_NAV: NavItem[] = [
  { label: "Vote", href: "/meal-vote/vote", icon: CheckSquare, match: exact("/meal-vote/vote") },
  { label: "Results", href: "/meal-vote/results", icon: Trophy, match: exact("/meal-vote/results") },
  {
    label: "Meals",
    href: "/meal-vote/meals",
    icon: UtensilsCrossed,
    match: (p) => p.startsWith("/meal-vote/meals"),
  },
];

const SPEND_TRACKER_NAV: NavItem[] = [
  {
    label: "Transactions",
    href: "/spend-tracker",
    icon: Wallet,
    match: (p) =>
      p === "/spend-tracker" ||
      p.startsWith("/spend-tracker/new") ||
      /^\/spend-tracker\/[^/]+\/edit$/.test(p),
  },
  {
    label: "Import",
    href: "/spend-tracker/import",
    icon: Upload,
    match: exact("/spend-tracker/import"),
  },
  {
    label: "Report",
    href: "/spend-tracker/report",
    icon: BarChart3,
    match: exact("/spend-tracker/report"),
  },
  {
    label: "Budgets",
    href: "/spend-tracker/budgets",
    icon: Target,
    match: exact("/spend-tracker/budgets"),
  },
  {
    label: "Categories",
    href: "/spend-tracker/categories",
    icon: ListChecks,
    match: exact("/spend-tracker/categories"),
  },
  {
    label: "Vendors",
    href: "/spend-tracker/vendors",
    icon: Users,
    match: exact("/spend-tracker/vendors"),
  },
];

const MINI_BREAKS_NAV: NavItem[] = [
  {
    label: "Mini Breaks",
    href: "/mini-breaks",
    icon: Plane,
    match: (p) =>
      p === "/mini-breaks" ||
      p.startsWith("/mini-breaks/new") ||
      /^\/mini-breaks\/[^/]+$/.test(p) ||
      /^\/mini-breaks\/[^/]+\/edit$/.test(p),
  },
  {
    label: "Categories",
    href: "/mini-breaks/categories",
    icon: Tag,
    match: exact("/mini-breaks/categories"),
  },
];

const CURING_NAV: NavItem[] = [
  {
    label: "Projects",
    href: "/curing",
    icon: ChefHat,
    match: (p) =>
      p === "/curing" ||
      p.startsWith("/curing/new") ||
      /^\/curing\/[^/]+$/.test(p) ||
      /^\/curing\/[^/]+\/edit$/.test(p),
  },
  {
    label: "Templates",
    href: "/curing/templates",
    icon: ListChecks,
    match: (p) => p.startsWith("/curing/templates"),
  },
];

const HOUSE_TASKS_NAV: NavItem[] = [
  {
    label: "Tasks",
    href: "/house-tasks",
    icon: ListTodo,
    match: (p) =>
      p === "/house-tasks" ||
      p.startsWith("/house-tasks/new") ||
      /^\/house-tasks\/[^/]+\/edit$/.test(p),
  },
  {
    label: "Completed",
    href: "/house-tasks/completed",
    icon: History,
    match: exact("/house-tasks/completed"),
  },
  {
    label: "Scoreboard",
    href: "/house-tasks/scoreboard",
    icon: BarChart3,
    match: exact("/house-tasks/scoreboard"),
  },
];

function SidebarLink({
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
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-accent text-accent-foreground"
          : "text-sidebar-foreground hover:bg-white/10"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

export function Sidebar({
  email,
  isAdmin,
  isHouseTasksAdmin,
  hasSpendTrackerAccess,
  hasMiniBreaksAccess,
  hasBakingAccess,
  isKiosk,
}: {
  email: string | null;
  isAdmin: boolean;
  isHouseTasksAdmin: boolean;
  hasSpendTrackerAccess: boolean;
  hasMiniBreaksAccess: boolean;
  hasBakingAccess: boolean;
  isKiosk: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const inMealVote = pathname.startsWith("/meal-vote");
  const inHouseTasks = pathname.startsWith("/house-tasks");
  const inSpendTracker = hasSpendTrackerAccess && pathname.startsWith("/spend-tracker");
  const inMiniBreaks = hasMiniBreaksAccess && pathname.startsWith("/mini-breaks");
  const inBaking = hasBakingAccess && pathname.startsWith("/curing");

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  const contextNav: NavItem[] = inMealVote
    ? [
        ...MEAL_VOTE_NAV,
        ...(isAdmin
          ? [
              {
                label: "Admin",
                href: "/meal-vote/admin/shortlist",
                icon: ShieldCheck,
                match: (p: string) => p.startsWith("/meal-vote/admin"),
              },
            ]
          : []),
      ]
    : inHouseTasks
      ? [
          ...HOUSE_TASKS_NAV,
          ...(isAdmin || isHouseTasksAdmin
            ? [
                {
                  label: "Approvals",
                  href: "/house-tasks/admin/approvals",
                  icon: ClipboardCheck,
                  match: exact("/house-tasks/admin/approvals"),
                },
              ]
            : []),
        ]
      : inSpendTracker
        ? SPEND_TRACKER_NAV
        : inMiniBreaks
          ? MINI_BREAKS_NAV
          : inBaking
            ? CURING_NAV
            : [];

  return (
    <>
      <div className="flex items-center justify-between bg-sidebar px-4 py-3 text-white sm:hidden print:hidden">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Home className="h-5 w-5 text-accent" />
          Family Hub
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 sm:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 sm:static sm:z-auto sm:w-56 sm:translate-x-0 print:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-white"
          >
            <Home className="h-5 w-5 text-accent" />
            Family Hub
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="sm:hidden"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2">
        <p className="mt-2 px-2 text-xs font-semibold uppercase tracking-wide text-sidebar-muted">
          Apps
        </p>
        <SidebarLink
          href="/meal-vote"
          active={inMealVote}
          icon={UtensilsCrossed}
          label="Meals"
        />
        <SidebarLink
          href="/house-tasks"
          active={inHouseTasks}
          icon={ListChecks}
          label="House Tasks"
        />
        <SidebarLink
          href="/watch-list"
          active={pathname.startsWith("/watch-list")}
          icon={Film}
          label="TV Shows/Movies"
        />
        <SidebarLink
          href="/diy-tasks"
          active={pathname.startsWith("/diy-tasks")}
          icon={Wrench}
          label="DIY Tasks"
        />
        {hasSpendTrackerAccess && (
          <SidebarLink
            href="/spend-tracker"
            active={inSpendTracker}
            icon={Wallet}
            label="Spend Tracker"
          />
        )}
        {hasMiniBreaksAccess && (
          <SidebarLink
            href="/mini-breaks"
            active={inMiniBreaks}
            icon={Plane}
            label="Mini Breaks"
          />
        )}
        {hasBakingAccess && (
          <SidebarLink
            href="/curing"
            active={inBaking}
            icon={ChefHat}
            label="Curing Projects"
          />
        )}

        {contextNav.length > 0 && (
          <>
            <p className="mt-4 px-2 text-xs font-semibold uppercase tracking-wide text-sidebar-muted">
              {inMealVote
                ? "Meal Vote"
                : inHouseTasks
                  ? "House Tasks"
                  : inSpendTracker
                    ? "Spend Tracker"
                    : inMiniBreaks
                      ? "Mini Breaks"
                      : "Curing Projects"}
            </p>
            {contextNav.map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                active={item.match(pathname)}
                icon={item.icon}
                label={item.label}
              />
            ))}
          </>
        )}
      </nav>

      <div className="flex flex-col gap-1 border-t border-white/10 px-2 py-3">
        {isAdmin && (
          <SidebarLink
            href="/admin/users"
            active={pathname === "/admin/users"}
            icon={Users}
            label="Manage family"
          />
        )}
        {isAdmin && (
          <SidebarLink
            href="/admin/settings"
            active={pathname === "/admin/settings"}
            icon={Palette}
            label="Appearance"
          />
        )}
        {!isKiosk && (
          <SidebarLink
            href="/account"
            active={pathname === "/account"}
            icon={User}
            label="Account"
          />
        )}
        {email && (
          <p className="truncate px-2 py-1 text-xs text-sidebar-muted">
            {email}
          </p>
        )}
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
      </aside>
    </>
  );
}
