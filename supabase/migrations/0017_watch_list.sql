-- TV Shows/Movies: any family member submits a viewing idea; anyone can
-- mark an item as "watching" or "watched" (watched items move to an
-- archive section in the UI — they're not deleted, just filtered out of
-- the main list).

create table watch_list_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('film', 'tv_show')),
  platform text not null,
  submitted_by uuid not null references profiles (id),
  is_watching boolean not null default false,
  watched boolean not null default false,
  watched_at timestamptz,
  created_at timestamptz not null default now()
);

alter table watch_list_items enable row level security;

create policy "watch_list_items_select_authenticated"
  on watch_list_items for select
  to authenticated
  using (true);

create policy "watch_list_items_insert_own"
  on watch_list_items for insert
  to authenticated
  with check (submitted_by = auth.uid());

-- Anyone can update any item — needed so any family member can toggle
-- watching/watched on someone else's submission, same "shared list"
-- model as House Tasks completion.
create policy "watch_list_items_update_authenticated"
  on watch_list_items for update
  to authenticated
  using (true)
  with check (true);
