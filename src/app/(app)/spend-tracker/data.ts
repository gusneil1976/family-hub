"use client";

// Browser-side reads for the Spend Tracker, cached and re-synced by TanStack
// Query (see src/lib/client/providers.tsx). Same queries the server pages used
// to run; RLS still limits them to people with Spend Tracker access.

import { useQuery, type QueryClient } from "@tanstack/react-query";
import type { Profile, SpendBudget, SpendCategory, Vendor } from "@/lib/types";
import { patch } from "@/lib/client/save";
import { must, sb } from "@/lib/client/supabase";
import { monthDate, monthDateRange } from "./month-utils";

export type TransactionRow = {
  id: string;
  date: string;
  amount: number;
  spent_by: string;
  notes: string | null;
  vendor: { name: string } | null;
  category: { name: string } | null;
  spender: { display_name: string | null } | null;
};

export type TransactionDetail = {
  id: string;
  date: string;
  amount: number;
  category_id: string | null;
  spent_by: string;
  notes: string | null;
  vendor: { name: string } | null;
};

export type TransactionAmount = {
  category_id: string | null;
  spent_by: string;
  amount: number;
};

// Every query key below starts with one of these, so a save can re-sync a
// whole family (e.g. every month's transactions) with a single prefix.
export const CATEGORIES = ["spend-categories"] as const;
export const VENDORS = ["vendors"] as const;
export const SPENDERS = ["profiles", "spend-tracker"] as const;
export const transactionsKey = (monthKey: string) => ["transactions", "month", monthKey] as const;
export const budgetsKey = (monthValue: string) => ["budgets", monthValue] as const;

/** Query keys any transaction change should re-sync (lists, report, edit screens). */
export const TRANSACTION_KEYS = [["transactions"], ["vendors"]] as const;

/** One month's transactions for the list page, newest first. */
export function useTransactions(year: number, month: number, monthKey: string) {
  return useQuery({
    queryKey: transactionsKey(monthKey),
    queryFn: async () => {
      const { startDate, endDate } = monthDateRange(year, month);
      return (
        must(
          await sb()
            .from("spend_transactions")
            .select(
              "id, date, amount, spent_by, notes, vendor:vendors(name), category:spend_categories(name), spender:profiles!spend_transactions_spent_by_fkey(display_name)",
            )
            .gte("date", startDate)
            .lt("date", endDate)
            .order("date", { ascending: false })
            .order("created_at", { ascending: false })
            .returns<TransactionRow[]>(),
        ) ?? []
      );
    },
  });
}

/** Just the amounts per category/person for the report grid. */
export function useTransactionAmounts(year: number, month: number, monthKey: string) {
  return useQuery({
    queryKey: ["transactions", "amounts", monthKey],
    queryFn: async () => {
      const { startDate, endDate } = monthDateRange(year, month);
      return (
        must(
          await sb()
            .from("spend_transactions")
            .select("category_id, spent_by, amount")
            .gte("date", startDate)
            .lt("date", endDate)
            .returns<TransactionAmount[]>(),
        ) ?? []
      );
    },
  });
}

/** One transaction for the edit screen — null when it doesn't exist (or isn't visible). */
export function useTransaction(id: string) {
  return useQuery({
    queryKey: ["transactions", "detail", id],
    queryFn: async () =>
      must(
        await sb()
          .from("spend_transactions")
          .select("id, date, amount, category_id, spent_by, notes, vendor:vendors(name)")
          .eq("id", id)
          .maybeSingle<TransactionDetail>(),
      ),
  });
}

export function useSpendCategories() {
  return useQuery({
    queryKey: CATEGORIES,
    queryFn: async () =>
      must(
        await sb()
          .from("spend_categories")
          .select("*")
          .order("name")
          .returns<SpendCategory[]>(),
      ) ?? [],
  });
}

export function useVendors() {
  return useQuery({
    queryKey: VENDORS,
    queryFn: async () =>
      must(await sb().from("vendors").select("*").order("name").returns<Vendor[]>()) ?? [],
  });
}

/** Everyone with Spend Tracker access — "Spent by" choices and report columns. */
export function useSpenders() {
  return useQuery({
    queryKey: SPENDERS,
    queryFn: async () =>
      must(
        await sb()
          .from("profiles")
          .select("*")
          .eq("has_spend_tracker_access", true)
          .order("display_name")
          .returns<Profile[]>(),
      ) ?? [],
  });
}

/** Budgets for one month (keyed by the first-of-month date stored in spend_budgets.month). */
export function useBudgets(year: number, month: number) {
  const monthValue = monthDate(year, month);
  return useQuery({
    queryKey: budgetsKey(monthValue),
    queryFn: async () =>
      must(
        await sb()
          .from("spend_budgets")
          .select("*")
          .eq("month", monthValue)
          .returns<SpendBudget[]>(),
      ) ?? [],
  });
}

/**
 * Optimistic twin of setBudget: a blank / zero / invalid amount clears the
 * category's budget, anything else upserts it.
 */
export function setBudgetInCache(
  qc: QueryClient,
  categoryId: string,
  monthValue: string,
  amountValue: string,
) {
  const amount = Number(amountValue);
  const clear = !amountValue.trim() || !Number.isFinite(amount) || amount <= 0;
  patch<SpendBudget[]>(qc, budgetsKey(monthValue), (budgets) => {
    const others = budgets.filter((b) => b.category_id !== categoryId);
    if (clear) return others;
    const existing = budgets.find((b) => b.category_id === categoryId);
    return [
      ...others,
      existing
        ? { ...existing, amount }
        : {
            id: `optimistic-${categoryId}`,
            category_id: categoryId,
            month: monthValue,
            amount,
            created_at: new Date().toISOString(),
          },
    ];
  });
}

/**
 * Optimistic twin of copyBudgetsFromPreviousMonth, using the previous month's
 * budgets if they're already cached (otherwise the re-sync fills them in).
 */
export function copyBudgetsInCache(qc: QueryClient, monthValue: string, previousMonth: string) {
  const previous = qc.getQueryData<SpendBudget[]>(budgetsKey(previousMonth));
  if (!previous) return;
  patch<SpendBudget[]>(qc, budgetsKey(monthValue), (budgets) => {
    const alreadySet = new Set(budgets.map((b) => b.category_id));
    return [
      ...budgets,
      ...previous
        .filter((b) => !alreadySet.has(b.category_id))
        .map((b) => ({
          ...b,
          id: `optimistic-${b.category_id}`,
          month: monthValue,
          created_at: new Date().toISOString(),
        })),
    ];
  });
}

/** Take a transaction out of every cached month list (delete). */
export function removeTransactionFromCache(qc: QueryClient, id: string) {
  for (const [key] of qc.getQueriesData<TransactionRow[]>({
    queryKey: ["transactions", "month"],
  })) {
    patch<TransactionRow[]>(qc, key, (rows) => rows.filter((t) => t.id !== id));
  }
}
