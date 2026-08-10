-- Kiosk mode: a single shared account (e.g. the fridge browser) that stays
-- permanently signed in for the whole family. It's only ever a normal
-- profile with no special access flags, so it's already naturally blocked
-- from every app gated behind a flag (Spend Tracker, Mini Breaks, Curing
-- Projects, all admin surfaces) — no changes needed there. What it *does*
-- need is the ability to write rows attributed to whichever real family
-- member is actually standing at the fridge, not to itself. See
-- src/components/who-picker.tsx and the actions that use it.

alter table profiles add column is_kiosk boolean not null default false;

create function public.is_kiosk_account()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_kiosk from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- votes: kiosk may attribute a vote to whichever family member picked it
-- ---------------------------------------------------------------------------

drop policy if exists "votes_insert_own" on votes;
create policy "votes_insert_own"
  on votes for insert
  to authenticated
  with check (
    (voter_id = auth.uid() or is_kiosk_account())
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

-- submitVotes replaces a voter's picks as delete-then-insert, so the
-- delete side needs the same kiosk allowance as the insert side above.
drop policy if exists "votes_delete_own" on votes;
create policy "votes_delete_own"
  on votes for delete
  to authenticated
  using (
    (voter_id = auth.uid() or is_kiosk_account())
    and exists (
      select 1 from voting_cycles vc
      where vc.id = votes.voting_cycle_id and vc.status = 'live'
    )
  );

-- ---------------------------------------------------------------------------
-- tasks / task_completions
-- ---------------------------------------------------------------------------

drop policy if exists "tasks_insert_own" on tasks;
create policy "tasks_insert_own"
  on tasks for insert
  to authenticated
  with check (created_by = auth.uid() or is_kiosk_account());

drop policy if exists "tasks_delete_owner_or_admin" on tasks;
create policy "tasks_delete_owner_or_admin"
  on tasks for delete
  to authenticated
  using (created_by = auth.uid() or is_house_tasks_admin() or is_kiosk_account());

drop policy if exists "task_completions_insert_own" on task_completions;
create policy "task_completions_insert_own"
  on task_completions for insert
  to authenticated
  with check (completed_by = auth.uid() or is_kiosk_account());

-- ---------------------------------------------------------------------------
-- watch_list_items
-- ---------------------------------------------------------------------------

drop policy if exists "watch_list_items_insert_own" on watch_list_items;
create policy "watch_list_items_insert_own"
  on watch_list_items for insert
  to authenticated
  with check (submitted_by = auth.uid() or is_kiosk_account());

drop policy if exists "watch_list_items_delete_owner_or_admin" on watch_list_items;
create policy "watch_list_items_delete_owner_or_admin"
  on watch_list_items for delete
  to authenticated
  using (submitted_by = auth.uid() or is_admin() or is_kiosk_account());

-- ---------------------------------------------------------------------------
-- diy_tasks
-- ---------------------------------------------------------------------------

drop policy if exists "diy_tasks_insert_own" on diy_tasks;
create policy "diy_tasks_insert_own"
  on diy_tasks for insert
  to authenticated
  with check (created_by = auth.uid() or is_kiosk_account());

drop policy if exists "diy_tasks_delete_owner_or_admin" on diy_tasks;
create policy "diy_tasks_delete_owner_or_admin"
  on diy_tasks for delete
  to authenticated
  using (created_by = auth.uid() or is_admin() or is_kiosk_account());
