"use server";

import { cookies } from "next/headers";
import { cookieSite, expiredCookie } from "@/lib/cookie-options";
import { redirect } from "next/navigation";
import { KIOSK_PREVIEW_COOKIE, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Admin-only — see requireUser()'s isPreviewingKiosk override.
export async function startKioskPreview() {
  await requireAdmin();
  const cookieStore = await cookies();
  cookieStore.set(KIOSK_PREVIEW_COOKIE, "1", { path: "/", ...cookieSite });
  redirect("/");
}

export async function stopKioskPreview() {
  const cookieStore = await cookies();
  cookieStore.set(KIOSK_PREVIEW_COOKIE, "", expiredCookie);
  redirect("/");
}
