"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionState = { error: string } | undefined;

export async function inviteFamilyMember(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();
  if (!email) {
    return { error: "Email is required." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: displayName ? { display_name: displayName } : undefined,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/users");
}

// Creates a fully active account with no email step at all — sidesteps
// invite-email deliverability issues (e.g. corporate link-scanning security
// consuming one-time invite links before the recipient ever sees them). The
// admin sets the password directly and communicates it themselves.
export async function createFamilyMember(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();

  if (!email) {
    return { error: "Email is required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: displayName ? { display_name: displayName } : undefined,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/users");
}

// Uses the admin client because migration 0001 deliberately revokes
// column-level UPDATE on profiles.is_admin from the authenticated role, so
// even an admin's normal RLS-scoped client can't touch it — see
// supabase/migrations/0001_init.sql.
export async function setAdmin(userId: string, isAdmin: boolean) {
  const { user } = await requireAdmin();

  if (userId === user.id) {
    throw new Error("You can't change your own admin status.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ is_admin: isAdmin })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/users");
}

// Reversible: blocks login (checked in requireUser()) without touching the
// person's history, unlike removeFamilyMember below.
export async function setArchived(userId: string, archived: boolean) {
  const { user } = await requireAdmin();

  if (userId === user.id) {
    throw new Error("You can't archive your own account.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ is_archived: archived })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/users");
}

// Grants/revokes rights to approve House Tasks point values (see
// supabase/migrations/0007_house_tasks.sql). Separate from the global
// is_admin flag so e.g. Anna can approve task points without full admin
// access to meal-vote or family management.
export async function setHouseTasksAdmin(userId: string, isAdmin: boolean) {
  const { user } = await requireAdmin();

  if (userId === user.id) {
    throw new Error("You can't change your own admin status.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ is_house_tasks_admin: isAdmin })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/users");
}

// Grants/revokes access to the Spend Tracker app (see
// supabase/migrations/0012_spend_tracker.sql). Deliberately separate from
// is_admin — this is meant to stay limited to whoever is explicitly given
// it, not expand to every admin automatically.
export async function setSpendTrackerAccess(userId: string, hasAccess: boolean) {
  const { user } = await requireAdmin();

  if (userId === user.id) {
    throw new Error("You can't change your own access.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ has_spend_tracker_access: hasAccess })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/users");
}

// Permanently deletes the auth user (cascades to their profile row). Fails
// with a foreign key error if they own meals, votes, or created cycles —
// archive them instead in that case.
export async function removeFamilyMember(userId: string) {
  const { user } = await requireAdmin();

  if (userId === user.id) {
    throw new Error("You can't remove your own account.");
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    throw new Error(
      error.message.toLowerCase().includes("foreign key")
        ? "Can't remove — this person has meals, votes, or other activity in the app. Archive them instead."
        : error.message,
    );
  }

  revalidatePath("/admin/users");
}
