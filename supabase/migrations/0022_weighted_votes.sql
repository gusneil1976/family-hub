-- Weighted meal voting: 1st choice = 3 points, 2nd = 2, 3rd = 1. Adds a
-- rank column to votes so submitVotes can capture pick order (previously an
-- unordered set of up to 3 meals), and results/live-standing tallies switch
-- from a raw vote count to a weighted point sum.

alter table votes add column rank smallint;

-- Backfill existing rows: assume they were entered in preference order, so
-- number them by created_at per (voting_cycle_id, voter_id).
with numbered as (
  select id, row_number() over (
    partition by voting_cycle_id, voter_id order by created_at
  ) as rn
  from votes
)
update votes set rank = numbered.rn
from numbered
where votes.id = numbered.id;

alter table votes alter column rank set not null;
alter table votes add constraint votes_rank_range check (rank between 1 and 3);
alter table votes add constraint votes_unique_rank unique (voting_cycle_id, voter_id, rank);

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
    and (
      select count(*) from votes v2
      where v2.voting_cycle_id = votes.voting_cycle_id
        and v2.voter_id = votes.voter_id
    ) <= 3
  );
