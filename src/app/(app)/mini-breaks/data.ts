"use client";

// Browser-side reads for Mini Breaks, cached and re-synced by TanStack Query
// (see src/lib/client/providers.tsx). Same queries the server pages used to
// run. Every hook takes `enabled` so nothing is fetched for someone without
// Mini Breaks access (RLS would refuse it anyway) while they're redirected.

import { useQuery, type QueryClient } from "@tanstack/react-query";
import type {
  MiniBreak,
  MiniBreakFile,
  MiniBreakUrl,
  MiniBreakUrlCategory,
} from "@/lib/types";
import { patch } from "@/lib/client/save";
import { must, sb } from "@/lib/client/supabase";

export type MiniBreakDetail = Pick<
  MiniBreak,
  "id" | "title" | "date_from" | "date_to" | "notes"
>;

export type UrlRow = MiniBreakUrl & { category: { name: string } | null };

export type FileRow = MiniBreakFile & {
  uploader: { display_name: string | null } | null;
  /** Short-lived link into the private bucket; null if signing failed. */
  signedUrl: string | null;
};

export type MiniBreakPage = {
  miniBreak: MiniBreakDetail | null;
  urls: UrlRow[];
  files: FileRow[];
};

export const MINI_BREAKS = ["mini-breaks"] as const;
export const CATEGORIES = ["mini-break-categories"] as const;
export const miniBreakKey = (id: string) => ["mini-break", id] as const;

export function useMiniBreaks(enabled: boolean) {
  return useQuery({
    queryKey: MINI_BREAKS,
    enabled,
    queryFn: async () =>
      must(
        await sb()
          .from("mini_breaks")
          .select("*")
          .order("date_from", { ascending: true, nullsFirst: false })
          .returns<MiniBreak[]>(),
      ) ?? [],
  });
}

export function useMiniBreakCategories(enabled: boolean) {
  return useQuery({
    queryKey: CATEGORIES,
    enabled,
    queryFn: async () =>
      must(
        await sb()
          .from("mini_break_url_categories")
          .select("*")
          .order("name")
          .returns<MiniBreakUrlCategory[]>(),
      ) ?? [],
  });
}

/** One mini break with its links and files (files carry signed image URLs). */
export function useMiniBreak(id: string, enabled: boolean) {
  return useQuery<MiniBreakPage>({
    queryKey: miniBreakKey(id),
    enabled,
    queryFn: async () => {
      const client = sb();
      const [miniBreak, urls, files] = await Promise.all([
        client
          .from("mini_breaks")
          .select("id, title, date_from, date_to, notes")
          .eq("id", id)
          .maybeSingle<MiniBreakDetail>()
          .then(must),
        client
          .from("mini_break_urls")
          .select("*, category:mini_break_url_categories(name)")
          .eq("mini_break_id", id)
          .order("created_at")
          .returns<UrlRow[]>()
          .then(must),
        client
          .from("mini_break_files")
          .select(
            "*, uploader:profiles!mini_break_files_uploaded_by_fkey(display_name)",
          )
          .eq("mini_break_id", id)
          .order("created_at")
          .returns<Omit<FileRow, "signedUrl">[]>()
          .then(must),
      ]);

      // Signed for an hour; the query re-runs well within that whenever the
      // page is open, so the cached links stay usable.
      const filePaths = (files ?? []).map((f) => f.file_path);
      const { data: signedUrls } =
        filePaths.length > 0
          ? await client.storage.from("mini-break-files").createSignedUrls(filePaths, 3600)
          : { data: [] };
      const signedUrlByPath = new Map(
        (signedUrls ?? []).map((s) => [s.path, s.signedUrl]),
      );

      return {
        miniBreak,
        urls: urls ?? [],
        files: (files ?? []).map((f) => ({
          ...f,
          signedUrl: signedUrlByPath.get(f.file_path) ?? null,
        })),
      };
    },
  });
}

export function patchMiniBreakPage(
  qc: QueryClient,
  id: string,
  fn: (page: MiniBreakPage) => MiniBreakPage,
) {
  patch<MiniBreakPage>(qc, miniBreakKey(id), fn);
}

export function removeMiniBreak(qc: QueryClient, id: string) {
  patch<MiniBreak[]>(qc, MINI_BREAKS, (all) => all.filter((mb) => mb.id !== id));
}
