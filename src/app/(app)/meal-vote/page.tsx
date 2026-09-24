"use client";

import Link from "next/link";
import { useMe } from "@/lib/client/me";
import Loading from "../loading";
import { useLiveCycle, useMyVotes } from "./data";

export default function MealVotePage() {
  const { data: me } = useMe();
  const liveCycle = useLiveCycle();
  const myVotes = useMyVotes(liveCycle.data?.id, me?.user.id);

  if (!me || liveCycle.data === undefined || (liveCycle.data && !myVotes.data)) {
    return <Loading />;
  }

  const cycle = liveCycle.data;
  const alreadyVoted = (myVotes.data?.length ?? 0) > 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Meal Vote</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Vote on this week&apos;s meal and browse the family recipe library.
      </p>

      {cycle && (
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
