import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import type { Meal, VotingCycle } from "@/lib/types";
import { ActionButton } from "./action-button";
import {
  closeVoting,
  generateShortlist,
  publishShortlist,
  topUpShortlist,
} from "./actions";
import { SHORTLIST_SIZE } from "./constants";
import { RemoveItemButton } from "./remove-item-button";

type ShortlistRow = { id: string; meal_id: string; meals: Meal };

export default async function AdminShortlistPage() {
  const { supabase } = await requireAdmin();

  const { data: cycle } = await supabase
    .from("voting_cycles")
    .select("*")
    .in("status", ["draft", "live"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<VotingCycle>();

  const { data: shortlist } = cycle
    ? await supabase
        .from("shortlist_entries")
        .select("id, meal_id, meals(*)")
        .eq("voting_cycle_id", cycle.id)
        .returns<ShortlistRow[]>()
    : { data: null };

  const { data: votes } = cycle?.status === "live"
    ? await supabase
        .from("votes")
        .select("meal_id, rank")
        .eq("voting_cycle_id", cycle.id)
    : { data: null };

  // 1st choice = 3 points, 2nd = 2, 3rd = 1.
  const POINTS_BY_RANK: Record<number, number> = { 1: 3, 2: 2, 3: 1 };
  const points = new Map<string, number>();
  votes?.forEach((v) => {
    const weight = POINTS_BY_RANK[v.rank] ?? 0;
    points.set(v.meal_id, (points.get(v.meal_id) ?? 0) + weight);
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Weekly shortlist
      </h1>

      {!cycle && (
        <div>
          <p className="mb-3 text-sm text-neutral-500">
            No shortlist in progress. Generating one draws randomly from
            meals ticked &quot;Weekly meal&quot; on the{" "}
            <Link href="/meal-vote/meals" className="underline">
              meal library
            </Link>
            .
          </p>
          <ActionButton
            action={generateShortlist}
            label="Generate shortlist"
            pendingLabel="Generating…"
          />
        </div>
      )}

      {cycle?.status === "draft" && (
        <div>
          <p className="mb-3 text-sm text-neutral-500">
            Draft shortlist — only you can see this. Remove any you don&apos;t
            want, top up to refill the gaps, or re-roll for a fresh set, then
            publish whatever&apos;s left for the family to vote on.
          </p>
          <p className="mb-2 text-sm text-neutral-500">
            {shortlist?.length ?? 0} of {SHORTLIST_SIZE} meals
          </p>
          <ul className="mb-4 divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
            {shortlist?.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between px-4 py-2 text-sm"
              >
                <span>{entry.meals.name}</span>
                <RemoveItemButton entryId={entry.id} />
              </li>
            ))}
          </ul>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <ActionButton
              action={topUpShortlist}
              label={`Top up to ${SHORTLIST_SIZE}`}
              pendingLabel="Topping up…"
              variant="secondary"
            />
          </div>
          <div className="mb-4">
            <ActionButton
              action={generateShortlist}
              label="Re-roll (replace all)"
              pendingLabel="Rolling…"
              variant="secondary"
            />
          </div>
          <ActionButton
            action={publishShortlist}
            label="Publish to family"
            pendingLabel="Publishing…"
          />
        </div>
      )}

      {cycle?.status === "live" && (
        <div>
          <p className="mb-1 text-sm text-neutral-500">
            Voting is live. Current standing (updates as votes come in):
          </p>
          <ul className="mb-4 mt-3 divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
            {shortlist
              ?.slice()
              .sort(
                (a, b) =>
                  (points.get(b.meal_id) ?? 0) - (points.get(a.meal_id) ?? 0),
              )
              .map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between px-4 py-2 text-sm"
                >
                  <span>{entry.meals.name}</span>
                  <span className="text-neutral-500">
                    {points.get(entry.meal_id) ?? 0} points
                  </span>
                </li>
              ))}
          </ul>
          <ActionButton
            action={closeVoting}
            label="Close voting"
            pendingLabel="Closing…"
          />
          <p className="mt-2 text-sm">
            <Link href="/meal-vote/results" className="underline">
              View results page
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
