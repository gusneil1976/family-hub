-- Deleting was intentionally left out of the original watch_list_items
-- migration; adding it now scoped to the submitter or a global admin,
-- same pattern as tasks_delete_owner_or_admin.

create policy "watch_list_items_delete_owner_or_admin"
  on watch_list_items for delete
  to authenticated
  using (submitted_by = auth.uid() or is_admin());
