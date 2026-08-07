import { requireUser } from "@/lib/auth";
import { Sidebar } from "./sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireUser();

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <Sidebar
        email={user.email ?? null}
        isAdmin={!!profile?.is_admin}
        isHouseTasksAdmin={!!profile?.is_house_tasks_admin}
        hasSpendTrackerAccess={!!profile?.has_spend_tracker_access}
        hasMiniBreaksAccess={!!profile?.has_mini_breaks_access}
      />
      <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
