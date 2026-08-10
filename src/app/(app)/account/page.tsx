import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { DisplayNameForm } from "./display-name-form";
import { SetPasswordForm } from "./set-password-form";

export default async function AccountPage() {
  const { profile } = await requireUser();

  // Kiosk is a shared login, not a personal one — no per-person account
  // settings to manage from it.
  if (profile?.is_kiosk) {
    redirect("/");
  }

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
