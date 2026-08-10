-- Curing Projects: private multi-step home food-project tracker (salami
-- curing, sourdough, cured meats, etc.). Templates define a reusable
-- sequence of day-offset steps; projects are concrete instances that
-- import a template's steps against a real start date, producing dated
-- milestones that can be completed and (for meat) logged with a weight.

alter table profiles
  add column has_baking_access boolean not null default false;

create function public.can_access_baking()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select has_baking_access from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- baking_templates
-- ---------------------------------------------------------------------------

create table baking_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

alter table baking_templates enable row level security;

create policy "baking_templates_all_with_access"
  on baking_templates for all
  to authenticated
  using (can_access_baking())
  with check (can_access_baking());

-- ---------------------------------------------------------------------------
-- baking_template_steps
-- ---------------------------------------------------------------------------

create table baking_template_steps (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references baking_templates (id) on delete cascade,
  offset_days int not null,
  label text not null,
  sort_order int not null default 0
);

alter table baking_template_steps enable row level security;

create policy "baking_template_steps_all_with_access"
  on baking_template_steps for all
  to authenticated
  using (can_access_baking())
  with check (can_access_baking());

-- ---------------------------------------------------------------------------
-- baking_projects
-- ---------------------------------------------------------------------------

create table baking_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  template_id uuid references baking_templates (id) on delete set null,
  start_date date not null,
  initial_weight numeric(7, 2),
  target_weight numeric(7, 2),
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

alter table baking_projects enable row level security;

create policy "baking_projects_all_with_access"
  on baking_projects for all
  to authenticated
  using (can_access_baking())
  with check (can_access_baking());

-- ---------------------------------------------------------------------------
-- baking_project_steps
-- ---------------------------------------------------------------------------

create table baking_project_steps (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references baking_projects (id) on delete cascade,
  label text not null,
  due_date date not null,
  completed_at timestamptz,
  weight numeric(7, 2),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table baking_project_steps enable row level security;

create policy "baking_project_steps_all_with_access"
  on baking_project_steps for all
  to authenticated
  using (can_access_baking())
  with check (can_access_baking());
