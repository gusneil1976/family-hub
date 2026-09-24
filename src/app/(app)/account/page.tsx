"use client";

import { useRequireAccess } from "@/lib/client/me";
import Loading from "../loading";
import { DisplayNameForm } from "./display-name-form";
import { SetPasswordForm } from "./set-password-form";

export default function AccountPage() {
  // Kiosk is a shared login, not a personal one — no per-person account
  // settings to manage from it, so it's sent back home.
  const me = useRequireAccess((p) => !p.is_kiosk);

  if (!me) return <Loading />;

  const profile = me.profile;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Account
      </h1>

      <div className="mb-8">
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">
          Display name
        </h2>
        <DisplayNameForm currentName={profile?.display_name ?? null} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">
          Password
        </h2>
        <SetPasswordForm />
      </div>
    </div>
  );
}
