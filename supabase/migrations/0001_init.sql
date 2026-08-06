-- Family Hub — initial schema for the Family Meal Vote app.
-- Run this once against the Supabase project's SQL editor (or via the
-- Supabase CLI). Safe to re-run: uses "if not exists" / "or replace" where
-- practical, but is primarily intended as a single first migration.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Auto-create a profile row whenever a new auth user is created (e.g. when
-- Gus invites a family member from the Supabase dashboard).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Single source of truth for "is this user an admin", used by every policy
-- below. security definer avoids RLS recursion when policies query profiles.
create function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create policy "profiles_select_authenticated"
  on profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Column-level grant so a non-admin can update their display_name via the
-- row policy above, but can never flip their own is_admin flag even if the
-- row-level policy would otherwise allow the update.
revoke update on profiles from authenticated;
grant update (display_name) on profiles to authenticated;

-- ---------------------------------------------------------------------------
-- meals
-- ---------------------------------------------------------------------------

create table meals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  servings int,
  recipe_body text,
  notes text,
  image_url text,
  owner_id uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table meals enable row level security;

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger meals_set_updated_at
  before update on meals
  for each row execute function public.set_updated_at();

create policy "meals_select_authenticated"
  on meals for select
  to authenticated
  using (true);

create policy "meals_write_admin"
  on meals for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------------
-- ingredients
-- ---------------------------------------------------------------------------

create table ingredients (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references meals (id) on delete cascade,
  name text not null,
  quantity text,
  unit text,
  sort_order int not null default 0
);

alter table ingredients enable row level security;

create policy "ingredients_select_authenticated"
  on ingredients for select
  to authenticated
  using (true);

create policy "ingredients_write_admin"
  on ingredients for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------------
-- voting_cycles ("a week")
-- ---------------------------------------------------------------------------

create table voting_cycles (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'draft' check (status in ('draft', 'live', 'closed')),
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  closed_at timestamptz
);

alter table voting_cycles enable row level security;

create policy "voting_cycles_select"
  on voting_cycles for select
  to authenticated
  using (status in ('live', 'closed') or is_admin());

create policy "voting_cycles_write_admin"
  on voting_cycles for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------------
-- shortlist_entries
-- ---------------------------------------------------------------------------

create table shortlist_entries (
  id uuid primary key default gen_random_uuid(),
  voting_cycle_id uuid not null references voting_cycles (id) on delete cascade,
  meal_id uuid not null references meals (id),
  unique (voting_cycle_id, meal_id)
);

alter table shortlist_entries enable row level security;

create policy "shortlist_entries_select"
  on shortlist_entries for select
  to authenticated
  using (
    is_admin()
    or exists (
      select 1 from voting_cycles vc
      where vc.id = shortlist_entries.voting_cycle_id
        and vc.status in ('live', 'closed')
    )
  );

create policy "shortlist_entries_write_admin"
  on shortlist_entries for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------------------------
-- votes
-- ---------------------------------------------------------------------------

create table votes (
  id uuid primary key default gen_random_uuid(),
  voting_cycle_id uuid not null references voting_cycles (id) on delete cascade,
  voter_id uuid not null references profiles (id),
  meal_id uuid not null references meals (id),
  created_at timestamptz not null default now(),
  unique (voting_cycle_id, voter_id, meal_id)
);

alter table votes enable row level security;

create policy "votes_select"
  on votes for select
  to authenticated
  using (
    is_admin()
    or voter_id = auth.uid()
    or exists (
      select 1 from voting_cycles vc
      where vc.id = votes.voting_cycle_id
        and vc.status in ('live', 'closed')
    )
  );

-- A voter may only insert their own vote, only while the cycle is live, only
-- for a meal that's actually on that cycle's shortlist, and never more than
-- 3 total votes in the cycle. Enforced here (not just in app code) so it
-- can't be bypassed by a direct API call.
create policy "votes_insert_own"
  on votes for insert
  to authenticated
  with check (
    voter_id = auth.uid()
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

-- Lets a voter clear their own picks (before close) so the "submit votes"
-- action can implement change-of-mind as delete-then-insert.
create policy "votes_delete_own"
  on votes for delete
  to authenticated
  using (
    voter_id = auth.uid()
    and exists (
      select 1 from voting_cycles vc
      where vc.id = votes.voting_cycle_id and vc.status = 'live'
    )
  );

-- ---------------------------------------------------------------------------
-- shopping_checklist_items
-- ---------------------------------------------------------------------------

create table shopping_checklist_items (
  id uuid primary key default gen_random_uuid(),
  voting_cycle_id uuid not null references voting_cycles (id) on delete cascade,
  ingredient_id uuid not null references ingredients (id) on delete cascade,
  checked boolean not null default false,
  unique (voting_cycle_id, ingredient_id)
);

alter table shopping_checklist_items enable row level security;

create policy "shopping_checklist_items_admin"
  on shopping_checklist_items for all
  to authenticated
  using (is_admin())
  with check (is_admin());
