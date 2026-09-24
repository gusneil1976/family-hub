"use client";

import { PageHeader } from "@/components/ui";
import { useMe } from "@/lib/client/me";
import Loading from "../../loading";
import { useFamily } from "../../house-tasks/data";
import { useLiveCycle, useMyVotes, useShortlist } from "../data";
import { VoteForm } from "./vote-form";

export default function VotePage() {
  const { data: me } = useMe();
  const isKiosk = !!me?.profile.is_kiosk;
  const cycleQuery = useLiveCycle();
  const cycle = cycleQuery.data;
  const shortlist = useShortlist(cycle?.id);
  // Kiosk has no "my votes" of its own — whoever's picked in the WhoPicker
  // just starts from a blank ranking each time, rather than trying to
  // preload a per-person selection client-side.
  const myVotes = useMyVotes(isKiosk ? undefined : cycle?.id, me?.user.id);
  const kioskProfiles = useFamily(isKiosk);

  if (!me || cycle === undefined) return <Loading />;

  if (!cycle) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">Vote</h1>
        <p className="text-sm text-neutral-500">
          No vote is open right now. Check back once this week&apos;s
          shortlist is published.
        </p>
      </div>
    );
  }

  if (
    !shortlist.data ||
    (isKiosk ? !kioskProfiles.data : !myVotes.data)
  ) {
    return <Loading />;
  }

  const meals = shortlist.data.map((s) => s.meals);
  const initialSelected = (myVotes.data ?? []).map((v) => v.meal_id);

  return (
    <div>
      <PageHeader
        title="Vote for this week's meal"
        description="Pick up to 3 meals and rank them. You can change your mind until voting closes."
      />
      <VoteForm
        cycleId={cycle.id}
        meals={meals}
        initialSelected={initialSelected}
        me={{ id: me.user.id, name: me.profile.display_name }}
        kioskProfiles={isKiosk ? kioskProfiles.data : undefined}
      />
    </div>
  );
}
