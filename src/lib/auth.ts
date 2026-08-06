import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

// Centralizes "who is the current user, and are they admin". Server
// Components/Actions use this for UX (hiding admin-only buttons, redirecting
// early); Postgres row-level security is the actual enforcement boundary.
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (profile?.is_archived) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  return { supabase, user, profile };
}

export async function requireAdmin() {
  const result = await requireUser();
  if (!result.profile?.is_admin) {
    redirect("/");
  }
  return result;
}

export async function requireHouseTasksAdmin() {
  const result = await requireUser();
  if (!result.profile?.is_admin && !result.profile?.is_house_tasks_admin) {
    redirect("/house-tasks");
  }
  return result;
}
