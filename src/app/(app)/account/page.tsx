import { requireUser } from "@/lib/auth";
import { DisplayNameForm } from "./display-name-form";
import { SetPasswordForm } from "./set-password-form";

export default async function AccountPage() {
  const { profile } = await requireUser();

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
