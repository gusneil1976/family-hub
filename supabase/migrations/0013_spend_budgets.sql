-- Per-category monthly spending targets for Spend Tracker's Report page.
-- month is always stored as the first of the month (e.g. 2026-08-01) so a
-- single date column can be compared/upserted on directly.

create table spend_budgets (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references spend_categories (id) on delete cascade,
  month date not null,
  amount numeric(10, 2) not null,
  created_at timestamptz not null default now(),
  unique (category_id, month),
  check (extract(day from month) = 1)
);

alter table spend_budgets enable row level security;

create policy "spend_budgets_all_with_access"
  on spend_budgets for all
  to authenticated
  using (can_access_spend_tracker())
  with check (can_access_spend_tracker());
