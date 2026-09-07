-- How many top-ranked meals the Results page shopping list covers — was
-- hardcoded to 2, now adjustable per cycle. Admin-only (same
-- voting_cycles_write_admin policy already covers it, no RLS changes
-- needed) — it's a cycle-wide setting, not a personal "tick off what I
-- have" action like shopping_checklist_items.
alter table voting_cycles
  add column shopping_list_meal_count int not null default 2
    check (shopping_list_meal_count >= 1);
