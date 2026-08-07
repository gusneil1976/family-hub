import { requireAdmin } from "@/lib/auth";
import type { Profile } from "@/lib/types";
import { AdminToggle } from "./admin-toggle";
import { ArchiveToggle } from "./archive-toggle";
import { CreateUserForm } from "./create-user-form";
import { HouseTasksAdminToggle } from "./house-tasks-admin-toggle";
import { InviteForm } from "./invite-form";
import { MiniBreaksToggle } from "./mini-breaks-toggle";
import { RemoveButton } from "./remove-button";
import { SpendTrackerToggle } from "./spend-tracker-toggle";

export default async function ManageUsersPage() {
  const { supabase, user: currentUser } = await requireAdmin();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at")
    .returns<Profile[]>();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-foreground">
        Manage family
      </h1>
      <p className="mb-4 text-sm text-neutral-500">
        Create accounts, promote/demote admins, or archive someone to block
        their login without losing their meals and votes.
      </p>

      <div className="mb-6 rounded-xl border border-card-border bg-card shadow-sm p-3">
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">
          Create account (set a password directly)
        </h2>
        <p className="mb-3 text-xs text-neutral-500">
          No email is sent — set a password here and tell them yourself.
          Recommended, since invite emails aren&apos;t reliable for every
          email provider.
        </p>
        <CreateUserForm />
      </div>

      <details className="mb-6">
        <summary className="cursor-pointer text-sm font-medium text-neutral-700">
          Or send an email invite instead
        </summary>
        <div className="mt-3 rounded-xl border border-card-border bg-card shadow-sm p-3">
          <InviteForm />
        </div>
      </details>

      <ul className="divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
        {profiles?.map((profile) => (
          <li
            key={profile.id}
            className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <span>
              {profile.display_name}
              {profile.is_admin && (
                <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                  Admin
                </span>
              )}
              {profile.is_archived && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Archived
                </span>
              )}
              {profile.is_house_tasks_admin && (
                <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                  Tasks admin
                </span>
              )}
              {profile.has_spend_tracker_access && (
                <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                  Spend tracker
                </span>
              )}
              {profile.has_mini_breaks_access && (
                <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                  Mini breaks
                </span>
              )}
              {profile.id === currentUser.id && (
                <span className="ml-2 text-neutral-400">(you)</span>
              )}
            </span>
            {profile.id !== currentUser.id && (
              <div className="flex flex-wrap items-center gap-3">
                <AdminToggle userId={profile.id} isAdmin={profile.is_admin} />
                <HouseTasksAdminToggle
                  userId={profile.id}
                  isAdmin={profile.is_house_tasks_admin}
                />
                <SpendTrackerToggle
                  userId={profile.id}
                  hasAccess={profile.has_spend_tracker_access}
                />
                <MiniBreaksToggle
                  userId={profile.id}
                  hasAccess={profile.has_mini_breaks_access}
                />
                <ArchiveToggle
                  userId={profile.id}
                  isArchived={profile.is_archived}
                />
                <RemoveButton userId={profile.id} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
