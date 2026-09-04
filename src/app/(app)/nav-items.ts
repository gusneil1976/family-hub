import {
  BarChart3,
  CheckSquare,
  History,
  ListTodo,
  Trophy,
  UtensilsCrossed,
} from "lucide-react";

export type IconType = React.ComponentType<{ className?: string }>;

export type NavItem = {
  label: string;
  href: string;
  icon: IconType;
  match: (pathname: string) => boolean;
};

export const exact = (href: string) => (pathname: string) => pathname === href;

// Shared between Sidebar (normal logins) and KioskNav (kiosk logins) so the
// two don't drift out of sync — kiosk only ever uses the House Tasks/Meal
// Vote ones (the two kiosk-reachable apps that have sub-pages), but Sidebar
// needs the rest too, so all of them live here together.
export const MEAL_VOTE_NAV: NavItem[] = [
  { label: "Vote", href: "/meal-vote/vote", icon: CheckSquare, match: exact("/meal-vote/vote") },
  { label: "Results", href: "/meal-vote/results", icon: Trophy, match: exact("/meal-vote/results") },
  {
    label: "Meals",
    href: "/meal-vote/meals",
    icon: UtensilsCrossed,
    match: (p) => p.startsWith("/meal-vote/meals"),
  },
];

export const HOUSE_TASKS_NAV: NavItem[] = [
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
