-- "Not completed": deducts a task's points from whoever it's assigned to,
-- regardless of who clicks the button (unlike completing, where the
-- clicker earns the credit). That means completed_by can now be someone
-- other than auth.uid() for a normal (non-kiosk) user too, as long as it's
-- the task's actual assignee — not an open door to attribute points to
-- arbitrary people.
drop policy if exists "task_completions_insert_own" on task_completions;
create policy "task_completions_insert_own"
  on task_completions for insert
  to authenticated
  with check (
    completed_by = auth.uid()
    or is_kiosk_account()
    or exists (
      select 1 from tasks t
      where t.id = task_completions.task_id
        and t.assigned_to = task_completions.completed_by
    )
  );
