import { requireUser } from "@/lib/auth";
import { KioskNav } from "./kiosk-nav";
import { Sidebar } from "./sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, isPreviewingKiosk } = await requireUser();

  if (profile?.is_kiosk) {
    return (
      <div className="flex min-h-screen flex-col">
        <KioskNav isPreviewingKiosk={isPreviewingKiosk} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <Sidebar
        email={user.email ?? null}
        isAdmin={!!profile?.is_admin}
        isHouseTasksAdmin={!!profile?.is_house_tasks_admin}
        hasSpendTrackerAccess={!!profile?.has_spend_tracker_access}
        hasMiniBreaksAccess={!!profile?.has_mini_breaks_access}
        hasBakingAccess={!!profile?.has_baking_access}
      />
      <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
