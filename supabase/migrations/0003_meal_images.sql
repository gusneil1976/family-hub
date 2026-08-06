-- Storage bucket for meal photos. Public read so thumbnails can be shown
-- directly via their public URL with no extra auth dance; writes restricted
-- to the admin, consistent with meal management elsewhere.

insert into storage.buckets (id, name, public)
values ('meal-images', 'meal-images', true)
on conflict (id) do nothing;

create policy "meal_images_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'meal-images');

create policy "meal_images_insert_admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'meal-images' and is_admin());

create policy "meal_images_update_admin"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'meal-images' and is_admin())
  with check (bucket_id = 'meal-images' and is_admin());

create policy "meal_images_delete_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'meal-images' and is_admin());
