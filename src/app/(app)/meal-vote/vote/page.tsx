import { requireUser } from "@/lib/auth";
import type { Meal, Profile, VotingCycle } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { submitVotes } from "./actions";
import { VoteForm } from "./vote-form";

type ShortlistRow = { meal_id: string; meals: Meal };

export default async function VotePage() {
  const { supabase, user, profile } = await requireUser();

  const { data: cycle } = await supabase
    .from("voting_cycles")
    .select("*")
    .eq("status", "live")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle<VotingCycle>();

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

  const { data: shortlist } = await supabase
    .from("shortlist_entries")
    .select("meal_id, meals(*)")
    .eq("voting_cycle_id", cycle.id)
    .returns<ShortlistRow[]>();

  // Kiosk has no "my votes" of its own — whoever's picked in the WhoPicker
  // just starts from a blank ranking each time, rather than trying to
  // preload a per-person selection client-side.
  const { data: myVotes } = profile?.is_kiosk
    ? { data: null }
    : await supabase
        .from("votes")
        .select("meal_id, rank")
        .eq("voting_cycle_id", cycle.id)
        .eq("voter_id", user.id)
        .order("rank", { ascending: true });

  const { data: kioskProfiles } = profile?.is_kiosk
    ? await supabase
        .from("profiles")
        .select("*")
        .eq("is_archived", false)
        .eq("is_kiosk", false)
        .order("display_name")
        .returns<Profile[]>()
    : { data: null };

  const meals = (shortlist ?? []).map((s) => s.meals);
  const initialSelected = (myVotes ?? []).map((v) => v.meal_id);

  return (
    <div>
      <PageHeader
        title="Vote for this week's meal"
        description="Pick up to 3 meals and rank them. You can change your mind until voting closes."
      />
      <VoteForm
        meals={meals}
        initialSelected={initialSelected}
        action={submitVotes.bind(null, cycle.id)}
        kioskProfiles={kioskProfiles ?? undefined}
      />
    </div>
  );
}
