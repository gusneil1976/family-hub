-- Mini Breaks: private trip-idea tracker for Gus & Anna. Trip ideas with
-- optional dates/notes, categorized reference URLs, and JPG file uploads
-- (ticket screenshots etc.) each with a short context note.
--
-- File uploads use a PRIVATE storage bucket (unlike meal-images, which is
-- public) — travel documents shouldn't be reachable by a guessed URL even
-- though the app route is already access-gated. Access is enforced via the
-- same can_access_mini_breaks() gate on both the tables and storage.objects.

create function public.can_access_mini_breaks()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select has_mini_breaks_access from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- mini_breaks
-- ---------------------------------------------------------------------------

create table mini_breaks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date_from date,
  date_to date,
  notes text,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

alter table mini_breaks enable row level security;

create policy "mini_breaks_all_with_access"
  on mini_breaks for all
  to authenticated
  using (can_access_mini_breaks())
  with check (can_access_mini_breaks());

-- ---------------------------------------------------------------------------
-- mini_break_url_categories
-- ---------------------------------------------------------------------------

create table mini_break_url_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table mini_break_url_categories enable row level security;

create policy "mini_break_url_categories_all_with_access"
  on mini_break_url_categories for all
  to authenticated
  using (can_access_mini_breaks())
  with check (can_access_mini_breaks());

insert into mini_break_url_categories (name) values ('Info'), ('Accommodation');

-- ---------------------------------------------------------------------------
-- mini_break_urls
-- ---------------------------------------------------------------------------

create table mini_break_urls (
  id uuid primary key default gen_random_uuid(),
  mini_break_id uuid not null references mini_breaks (id) on delete cascade,
  category_id uuid references mini_break_url_categories (id) on delete set null,
  url text not null,
  created_at timestamptz not null default now()
);

alter table mini_break_urls enable row level security;

create policy "mini_break_urls_all_with_access"
  on mini_break_urls for all
  to authenticated
  using (can_access_mini_breaks())
  with check (can_access_mini_breaks());

-- ---------------------------------------------------------------------------
-- mini_break_files
-- ---------------------------------------------------------------------------

create table mini_break_files (
  id uuid primary key default gen_random_uuid(),
  mini_break_id uuid not null references mini_breaks (id) on delete cascade,
  file_path text not null,
  description text,
  uploaded_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

alter table mini_break_files enable row level security;

create policy "mini_break_files_all_with_access"
  on mini_break_files for all
  to authenticated
  using (can_access_mini_breaks())
  with check (can_access_mini_breaks());

-- ---------------------------------------------------------------------------
-- Storage: private bucket for uploaded screenshots/documents
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('mini-break-files', 'mini-break-files', false)
on conflict (id) do nothing;

create policy "mini_break_files_storage_select_with_access"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'mini-break-files' and can_access_mini_breaks());

create policy "mini_break_files_storage_insert_with_access"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'mini-break-files' and can_access_mini_breaks());

create policy "mini_break_files_storage_delete_with_access"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'mini-break-files' and can_access_mini_breaks());
