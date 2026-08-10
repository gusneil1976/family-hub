-- Fix "infinite recursion detected in policy for relation votes" when
-- submitting ranked votes. votes_insert_own's WITH CHECK counted existing
-- rows in `votes` from within a policy defined on `votes` itself — a
-- self-referential subquery that trips Postgres's RLS recursion guard.
--
-- It's also redundant since migration 0022: rank is constrained to 1-3 and
-- unique per (voting_cycle_id, voter_id, rank), so a voter can never end up
-- with more than 3 rows in a cycle regardless of this check.

drop policy if exists "votes_insert_own" on votes;
create policy "votes_insert_own"
  on votes for insert
  to authenticated
  with check (
    voter_id = auth.uid()
    and rank between 1 and 3
    and exists (
      select 1 from voting_cycles vc
      where vc.id = votes.voting_cycle_id and vc.status = 'live'
    )
    and exists (
      select 1 from shortlist_entries se
      where se.voting_cycle_id = votes.voting_cycle_id
        and se.meal_id = votes.meal_id
    )
  );
