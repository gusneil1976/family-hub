-- DIY Tasks: home-improvement project tracker. Visible to the whole family
-- like Meals/House Tasks/TV Shows — no access flag. Much simpler than House
-- Tasks: no assignment (one person does the DIY), no points, no recurrence,
-- no due date. Adds a project grouping, notes, an hours estimate, and a
-- percent-complete slider for tracking progress on multi-session projects.

create table diy_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  project text,
  notes text,
  hours_estimate numeric(5, 1),
  percent_complete int not null default 0 check (percent_complete between 0 and 100),
  -- Authoritative "done" signal, separate from percent_complete — set by
  -- the summary screen's Complete checkbox (which also forces percent to
  -- 100), not implicitly by manually sliding percent up to 100.
  completed_at timestamptz,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

alter table diy_tasks enable row level security;

create policy "diy_tasks_select_authenticated"
  on diy_tasks for select
  to authenticated
  using (true);

create policy "diy_tasks_insert_own"
  on diy_tasks for insert
  to authenticated
  with check (created_by = auth.uid());

-- Anyone can update — needed so any family member can nudge the progress
-- slider or tick Complete, same "shared list" model as House Tasks
-- completion. Full-field editing is additionally gated at the app layer
-- (creator or admin), same as Watch List.
create policy "diy_tasks_update_authenticated"
  on diy_tasks for update
  to authenticated
  using (true)
  with check (true);

create policy "diy_tasks_delete_owner_or_admin"
  on diy_tasks for delete
  to authenticated
  using (created_by = auth.uid() or is_admin());
