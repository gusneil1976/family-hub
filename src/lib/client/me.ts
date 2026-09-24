"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { Profile } from "@/lib/types";
import { NotSignedIn } from "@/lib/client/providers";
import { must, sb } from "@/lib/client/supabase";

export type Me = {
  user: { id: string; email: string | null };
  profile: Profile;
  isPreviewingKiosk?: boolean;
};

// Browser twin of requireUser() in src/lib/auth.ts: who is signed in, their
// profile flags, and the admin-only kiosk preview override. The proxy has
// already bounced anyone without a session to /login; RLS is still the real
// permission check on every read and write.
export function useMe() {
  return useQuery<Me, Error, Required<Me>>({
    queryKey: ["me"],
    queryFn: async () => {
      const {
        data: { session },
      } = await sb().auth.getSession();
      if (!session) throw new NotSignedIn();
      const user = { id: session.user.id, email: session.user.email ?? null };
      const profile = must(
        await sb().from("profiles").select("*").eq("id", user.id).single<Profile>(),
      );
      return { user, profile };
    },
    refetchInterval: 120_000,
    // Read the preview cookie on every render rather than caching it, so
    // starting/stopping the preview takes effect straight away.
    select: (d: Me) => {
      const isPreviewingKiosk =
        d.profile.is_admin &&
        typeof document !== "undefined" &&
        document.cookie.split("; ").some((c) => c === "kiosk_preview=1");
      return {
        ...d,
        profile: isPreviewingKiosk ? { ...d.profile, is_kiosk: true } : d.profile,
        isPreviewingKiosk,
      };
    },
  });
}

/**
 * Browser twin of requireSpendTrackerAccess() & co: returns the signed-in
 * person once their profile passes `allowed`, otherwise sends them to
 * `fallback`. Returns null while loading or redirecting.
 */
export function useRequireAccess(
  allowed: (profile: Profile) => boolean,
  fallback = "/",
): Required<Me> | null {
  const { data: me } = useMe();
  const router = useRouter();
  const ok = !!me && allowed(me.profile);
  useEffect(() => {
    if (me && !ok) router.replace(fallback);
  }, [me, ok, router, fallback]);
  return ok ? me : null;
}
