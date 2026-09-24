"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

// One browser Supabase client for the whole app. Screens read straight from the
// database with it — row-level security applies exactly as it does on the server.
let client: SupabaseClient | null = null;

export function sb(): SupabaseClient {
  client ??= createClient();
  return client;
}

/** Unwraps a Supabase result, throwing its error so TanStack Query sees a failed fetch. */
export function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}
