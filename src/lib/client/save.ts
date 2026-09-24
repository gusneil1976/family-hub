"use client";

// Calling server actions from the browser, warehouse-style.
//
// useSave() applies an optional optimistic change to the cached data straight
// away (so the screen updates instantly), runs the server action, rolls the
// cache back and shows a toast if the server refuses it, then re-syncs the
// affected queries in the background.

import { useCallback } from "react";
import { useQueryClient, type QueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "@/lib/client/toast";

export interface SaveOptions {
  /** Query key prefixes to re-sync afterwards, e.g. [["tasks"]]. */
  keys: QueryKey[];
  /** Patch the cache before the server answers. */
  optimistic?: (qc: QueryClient) => void;
  /** Toast shown when the save succeeds. */
  ok?: string;
  /** Wait for the re-sync before resolving (so the next screen already shows it). */
  awaitSync?: boolean;
}

// How many saves are on their way to the server. Re-syncs are held back until
// the last one lands, otherwise a refresh arriving between two quick taps would
// briefly undo the second one on screen.
let inflight = 0;
const pendingKeys: QueryKey[] = [];

/** Server actions that call redirect() reject with this. Next's router has
 * already started the navigation by then, so it just means "saved". */
export function isRedirect(err: unknown) {
  const digest = (err as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

function describe(err: unknown): string {
  const message = err instanceof Error ? err.message : "";
  if (!message || /fetch|network|load failed/i.test(message))
    return "Couldn't reach the server — check the connection and try again.";
  // Production builds hide thrown server errors behind a generic message.
  if (/Server Components render|digest/i.test(message))
    return "Couldn't save that — please try again.";
  return message;
}

export function useSave() {
  const qc = useQueryClient();
  return useCallback(
    async <T,>(
      fn: () => Promise<T>,
      opts: SaveOptions,
    ): Promise<{ ok: boolean; data?: T }> => {
      inflight++;
      let snapshot: [QueryKey, unknown][] = [];
      if (opts.optimistic) {
        await Promise.all(opts.keys.map((k) => qc.cancelQueries({ queryKey: k })));
        snapshot = opts.keys.flatMap((k) => qc.getQueriesData({ queryKey: k }));
        opts.optimistic(qc);
      }
      let ok = true;
      let data: T | undefined;
      let redirected = false;
      let failure: string | null = null;
      try {
        data = await fn();
        // Form-style actions report problems as { error } instead of throwing.
        const reported = (data as { error?: unknown } | null | undefined)?.error;
        if (typeof reported === "string" && reported) failure = reported;
      } catch (err) {
        if (isRedirect(err)) redirected = true;
        else failure = describe(err);
      }
      if (failure) {
        ok = false;
        for (const [k, d] of snapshot) qc.setQueryData(k, d);
        toast(failure, "error");
      }
      pendingKeys.push(...opts.keys);
      if (--inflight === 0) {
        const keys = pendingKeys.splice(0);
        const sync = Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: k })));
        if ((opts.awaitSync || redirected) && ok) await sync.catch(() => {});
      }
      if (ok && opts.ok) toast(opts.ok);
      return { ok, data };
    },
    [qc],
  );
}

/** Immutable update of one cached query (no-op if it isn't loaded). */
export function patch<T>(qc: QueryClient, key: QueryKey, fn: (d: T) => T) {
  qc.setQueryData<T>(key, (d) => (d === undefined ? d : fn(d)));
}

/**
 * Wraps a form-style server action (used with useActionState) so the cached
 * data is refreshed when it succeeds — including when it finishes by
 * redirecting to a list page, which should then already show the change.
 */
export function useSyncedAction<S>(
  action: (state: S, formData: FormData) => Promise<S>,
  keys: QueryKey[],
) {
  const qc = useQueryClient();
  const refresh = () =>
    Promise.all(keys.map((k) => qc.refetchQueries({ queryKey: k, type: "all" }))).catch(() => {});
  return async (state: S, formData: FormData): Promise<S> => {
    try {
      const result = await action(state, formData);
      void refresh();
      return result;
    } catch (err) {
      if (isRedirect(err)) await refresh();
      throw err;
    }
  };
}
