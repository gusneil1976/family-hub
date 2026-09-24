"use client";

// Browser-side reads for the watch list, cached and re-synced by TanStack
// Query (see src/lib/client/providers.tsx). Same query the server page used to
// run; the edit page and the platform suggestions are served from it too.

import { useQuery, type QueryClient } from "@tanstack/react-query";
import type { WatchListItem } from "@/lib/types";
import { patch } from "@/lib/client/save";
import { must, sb } from "@/lib/client/supabase";

export type ItemRow = WatchListItem & {
  submitter: { display_name: string | null } | null;
};

export const WATCH_ITEMS = ["watch-items"] as const;

/** Query key prefixes every watch-list change should re-sync. */
export const WATCH_KEYS = [["watch-items"]] as const;

export function useWatchItems() {
  return useQuery({
    queryKey: WATCH_ITEMS,
    queryFn: async () =>
      must(
        await sb()
          .from("watch_list_items")
          .select(
            "*, submitter:profiles!watch_list_items_submitted_by_fkey(display_name)",
          )
          .order("created_at", { ascending: false })
          .returns<ItemRow[]>(),
      ) ?? [],
  });
}

/** Distinct platforms already used, alphabetically — the form's suggestions. */
export function platformOptionsFrom(items: ItemRow[]) {
  return Array.from(new Set(items.map((i) => i.platform))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function patchWatchItem(
  qc: QueryClient,
  itemId: string,
  fn: (item: ItemRow) => ItemRow,
) {
  patch<ItemRow[]>(qc, WATCH_ITEMS, (items) =>
    items.map((i) => (i.id === itemId ? fn(i) : i)),
  );
}

export function removeWatchItem(qc: QueryClient, itemId: string) {
  patch<ItemRow[]>(qc, WATCH_ITEMS, (items) => items.filter((i) => i.id !== itemId));
}
