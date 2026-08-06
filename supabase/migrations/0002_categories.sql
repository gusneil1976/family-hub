-- Recipe categories (Main, Starter, Dessert, and admin-defined ones like
-- "Cured meats") plus the ability to scope a shortlist to a chosen set of
-- them — e.g. only "Main" for the weekly family vote, or only "Starter" and
-- "Dessert" when picking options for an event.

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table categories enable row level security;

create policy "categories_select_authenticated"
  on categories for select
  to authenticated
  using (true);

create policy "categories_write_admin"
  on categories for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- Seed the common course types so the app is usable immediately; add more
-- (e.g. "Cured meats") from the Manage categories page.
insert into categories (name) values ('Main'), ('Starter'), ('Dessert');

alter table meals
  add column category_id uuid references categories (id) on delete set null;

-- Which categories were eligible when a shortlist was drawn, so re-rolling
-- keeps the same scope without the admin having to reselect it each time.
alter table voting_cycles
  add column category_ids uuid[];
