-- Single-row settings table for hub-wide preferences, starting with the
-- colour palette. Readable by anyone (even signed-out visitors, so the
-- login page matches too); only global admins can change it.

create table hub_settings (
  id int primary key default 1 check (id = 1),
  color_palette text not null default 'terracotta',
  updated_at timestamptz not null default now()
);

insert into hub_settings (id) values (1);

alter table hub_settings enable row level security;

create policy "hub_settings_select_public"
  on hub_settings for select
  to public
  using (true);

create policy "hub_settings_update_admin"
  on hub_settings for update
  to authenticated
  using (is_admin())
  with check (is_admin());
