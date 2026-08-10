-- Shopping list checklist: viewable by everyone on the results page (so the
-- whole household can see what's needed), but only ticking items off
-- ("already have this") is restricted to whoever holds this flag —
-- deliberately separate from is_admin, same pattern as
-- has_spend_tracker_access/has_mini_breaks_access/has_baking_access.

alter table profiles
  add column has_shopping_list_access boolean not null default false;

create function public.can_manage_shopping_list()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select has_shopping_list_access from public.profiles where id = auth.uid()),
    false
  );
$$;

drop policy if exists "shopping_checklist_items_admin" on shopping_checklist_items;

create policy "shopping_checklist_items_select_all"
  on shopping_checklist_items for select
  to authenticated
  using (true);

create policy "shopping_checklist_items_write"
  on shopping_checklist_items for all
  to authenticated
  using (can_manage_shopping_list())
  with check (can_manage_shopping_list());
