import Link from "next/link";
import { requireUser } from "@/lib/auth";
import type { VotingCycle } from "@/lib/types";

export default async function MealVotePage() {
  const { supabase, user } = await requireUser();

  const { data: liveCycle } = await supabase
    .from("voting_cycles")
    .select("*")
    .eq("status", "live")
    .maybeSingle<VotingCycle>();

  let alreadyVoted = false;
  if (liveCycle) {
    const { count } = await supabase
      .from("votes")
      .select("id", { count: "exact", head: true })
      .eq("voting_cycle_id", liveCycle.id)
      .eq("voter_id", user.id);
    alreadyVoted = (count ?? 0) > 0;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Meal Vote</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Vote on this week&apos;s meal and browse the family recipe library.
      </p>

      {liveCycle && (
        <div className="mt-4 rounded-md border border-neutral-300 bg-neutral-50 px-4 py-3">
          <p className="text-sm text-neutral-800">
            {alreadyVoted
              ? "Voting is open — you can still change your picks."
              : "Voting is open for this week's meal."}
          </p>
          <Link
            href="/meal-vote/vote"
            className="mt-2 inline-block rounded-md bg-accent hover:bg-accent-hover px-3 py-1.5 text-sm font-medium text-white"
          >
            {alreadyVoted ? "Update my votes" : "Vote now"}
          </Link>
        </div>
      )}
    </div>
  );
}
