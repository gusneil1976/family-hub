-- House Tasks: the second mini-app. Any family member can create a chore
-- and assign it to themselves or someone else; anyone can mark any task
-- done and earn its points. A small separate "house tasks admin" role
-- (distinct from the global is_admin) approves the point value a task is
-- worth before it counts toward the scoreboard.

alter table profiles
  add column is_house_tasks_admin boolean not null default false;

create function public.is_house_tasks_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_admin or is_house_tasks_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------

create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  points int not null default 1,
  points_approved boolean not null default false,
  created_by uuid not null references profiles (id),
  assigned_to uuid not null references profiles (id),
  due_date date,
  recurrence_unit text check (recurrence_unit in ('days', 'weeks', 'months')),
  recurrence_value int,
  is_active boolean not null default true,
  -- null = currently pending. Set on completion; for recurring tasks with a
  -- due date, cleared again once the due date advances to the next cycle.
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table tasks enable row level security;

create policy "tasks_select_authenticated"
  on tasks for select
  to authenticated
  using (true);

create policy "tasks_insert_own"
  on tasks for insert
  to authenticated
  with check (created_by = auth.uid());

-- Anyone can update a task (needed so any family member can mark any task
-- complete, which only touches completed_at/due_date) — points/points_approved
-- are separately locked down via column grants below, not by this policy.
create policy "tasks_update_authenticated"
  on tasks for update
  to authenticated
  using (true)
  with check (true);

create policy "tasks_delete_owner_or_admin"
  on tasks for delete
  to authenticated
  using (created_by = auth.uid() or is_house_tasks_admin());

-- Column-level lock: only the admin client (service_role, used after a
-- requireHouseTasksAdmin()-style check in the approval action) may change
-- the points value or its approval status.
revoke update on tasks from authenticated;
grant update (
  title, description, assigned_to, due_date,
  recurrence_unit, recurrence_value, is_active, completed_at
) on tasks to authenticated;

-- ---------------------------------------------------------------------------
-- task_completions
-- ---------------------------------------------------------------------------

create table task_completions (
  id uuid primary key default gen_random_uuid(),
  -- No cascade: deleting a task with completions is blocked at the DB level
  -- so history can't be silently destroyed; deactivate the task instead.
  task_id uuid not null references tasks (id),
  completed_by uuid not null references profiles (id),
  -- Snapshot of tasks.points at completion time, so later point edits never
  -- retroactively change history.
  points int not null,
  completed_at timestamptz not null default now()
);

alter table task_completions enable row level security;

create policy "task_completions_select_authenticated"
  on task_completions for select
  to authenticated
  using (true);

create policy "task_completions_insert_own"
  on task_completions for insert
  to authenticated
  with check (completed_by = auth.uid());
