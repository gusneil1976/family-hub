"use client";

// Browser-side read of every profile for Manage family (cached by TanStack
// Query), plus the optimistic patch the per-person toggles use. Profiles are
// readable by any signed-in family member under RLS, so no service-role read
// is needed here; the writes stay server actions using the admin client.

import { useQuery, type QueryClient } from "@tanstack/react-query";
import type { Profile } from "@/lib/types";
import { patch } from "@/lib/client/save";
import { must, sb } from "@/lib/client/supabase";

export const ALL_PROFILES = ["profiles", "all"] as const;

/** Every profile change can show up in people pickers and in the person's own access. */
export const PROFILE_KEYS = [["profiles"], ["me"]];

export function useAllProfiles() {
  return useQuery({
    queryKey: ALL_PROFILES,
    queryFn: async () =>
      must(
        await sb()
          .from("profiles")
          .select("*")
          .order("created_at")
          .returns<Profile[]>(),
      ) ?? [],
  });
}

type Flag =
  | "is_admin"
  | "is_archived"
  | "is_house_tasks_admin"
  | "has_spend_tracker_access"
  | "has_mini_breaks_access"
  | "has_baking_access"
  | "has_shopping_list_access"
  | "is_kiosk";

export function setFlagInCache(qc: QueryClient, userId: string, flag: Flag, value: boolean) {
  patch<Profile[]>(qc, ALL_PROFILES, (rows) =>
    rows.map((p) => (p.id === userId ? { ...p, [flag]: value } : p)),
  );
}

export function removeProfileInCache(qc: QueryClient, userId: string) {
  patch<Profile[]>(qc, ALL_PROFILES, (rows) => rows.filter((p) => p.id !== userId));
}
