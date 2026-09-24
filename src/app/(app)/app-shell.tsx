"use client";

import { useEffect, type ReactNode } from "react";
import { useMe } from "@/lib/client/me";
import { NotSignedIn, useForgetData } from "@/lib/client/providers";
import { signOut } from "./actions";
import { KioskNav } from "./kiosk-nav";
import { Sidebar } from "./sidebar";
import Loading from "./loading";

// The signed-in frame around every page, drawn in the browser from the cached
// profile (useMe) so it appears instantly instead of waiting on the server.
export function AppShell({ children }: { children: ReactNode }) {
  const { data: me, error } = useMe();
  const forget = useForgetData();
  const profile = me?.profile;
  const signedOut = error instanceof NotSignedIn || !!profile?.is_archived;

  // Archived members (or an expired session) are signed out, as requireUser does.
  useEffect(() => {
    if (!signedOut) return;
    forget();
    void signOut();
  }, [signedOut, forget]);

  if (!me) {
    return (
      <div className="flex min-h-screen flex-col sm:flex-row">
        <div className="bg-sidebar sm:min-h-screen sm:w-56" />
        <main className="flex-1 px-6 py-8 sm:px-10">
          <div className="mx-auto max-w-4xl">
            <Loading />
          </div>
        </main>
      </div>
    );
  }

  if (profile?.is_kiosk) {
    return (
      <div className="flex min-h-screen flex-col">
        <KioskNav isPreviewingKiosk={me.isPreviewingKiosk} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <Sidebar
        email={me.user.email}
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
