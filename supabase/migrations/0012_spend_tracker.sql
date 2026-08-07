-- Spend Tracker: the third mini-app, private to whoever has
-- has_spend_tracker_access — unlike Meals/House Tasks, everyone else
-- shouldn't even know this app exists (no tile, no sidebar entry, direct
-- navigation redirected away).

alter table profiles
  add column has_spend_tracker_access boolean not null default false;

create function public.can_access_spend_tracker()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select has_spend_tracker_access from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- spend_categories
-- ---------------------------------------------------------------------------

create table spend_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table spend_categories enable row level security;

create policy "spend_categories_all_with_access"
  on spend_categories for all
  to authenticated
  using (can_access_spend_tracker())
  with check (can_access_spend_tracker());

-- ---------------------------------------------------------------------------
-- vendors
-- ---------------------------------------------------------------------------

create table vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create unique index vendors_name_lower_idx on vendors (lower(name));

alter table vendors enable row level security;

create policy "vendors_all_with_access"
  on vendors for all
  to authenticated
  using (can_access_spend_tracker())
  with check (can_access_spend_tracker());

-- ---------------------------------------------------------------------------
-- spend_transactions
-- ---------------------------------------------------------------------------

create table spend_transactions (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  vendor_id uuid not null references vendors (id),
  category_id uuid references spend_categories (id) on delete set null,
  amount numeric(10, 2) not null,
  spent_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

alter table spend_transactions enable row level security;

create policy "spend_transactions_select_with_access"
  on spend_transactions for select
  to authenticated
  using (can_access_spend_tracker());

-- Self-attribution on the way in; who it's attributed to can be corrected
-- afterward via the (unrestricted, access-gated) update policy below.
create policy "spend_transactions_insert_own"
  on spend_transactions for insert
  to authenticated
  with check (can_access_spend_tracker() and spent_by = auth.uid());

create policy "spend_transactions_update_with_access"
  on spend_transactions for update
  to authenticated
  using (can_access_spend_tracker())
  with check (can_access_spend_tracker());

create policy "spend_transactions_delete_with_access"
  on spend_transactions for delete
  to authenticated
  using (can_access_spend_tracker());
