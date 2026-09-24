"use client";

// The browser-side data store. Every screen's data lives in the TanStack Query
// cache, which is saved to IndexedDB so the app opens instantly from what was
// there last time, then refreshes quietly in the background.

import { useCallback, useState, type ReactNode } from "react";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { del, get, set } from "idb-keyval";
import { Toaster } from "@/components/toaster";

const CACHE_KEY = "family-hub-cache";
const WEEK = 7 * 86_400_000;

export class NotSignedIn extends Error {}

/** Wipe the saved browser copy of the data (on sign-in / sign-out). */
export async function clearSavedData() {
  try {
    await del(CACHE_KEY);
  } catch {}
}

/** Forget everything cached in this browser — used when signing out. */
export function useForgetData() {
  const qc = useQueryClient();
  return useCallback(() => {
    qc.clear();
    void clearSavedData();
  }, [qc]);
}

const persister = createAsyncStoragePersister({
  storage:
    typeof window === "undefined"
      ? undefined
      : {
          getItem: (k: string) => get<string>(k).then((v) => v ?? null),
          setItem: (k: string, v: string) => set(k, v),
          removeItem: (k: string) => del(k),
        },
  key: CACHE_KEY,
  throttleTime: 1000,
});

export function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Show cached data immediately; refresh in the background.
            staleTime: 3_000,
            gcTime: WEEK,
            refetchOnWindowFocus: true,
            // Keeps the fridge screen up to date with changes made on phones.
            refetchInterval: 60_000,
            refetchIntervalInBackground: false,
            retry: (n, err) => !(err instanceof NotSignedIn) && n < 2,
          },
        },
      }),
  );
  return (
    <PersistQueryClientProvider
      client={qc}
      persistOptions={{
        persister,
        maxAge: WEEK,
        buster: "fh-v1",
        dehydrateOptions: {
          shouldDehydrateQuery: (q) => q.state.status === "success",
        },
      }}
    >
      {children}
      <Toaster />
    </PersistQueryClientProvider>
  );
}
