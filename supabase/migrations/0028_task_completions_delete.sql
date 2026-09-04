-- Lets a completion be undone (anyone's, not just your own), matching the
-- same "anyone can complete anyone's task" shared-household model already
-- used for tasks/watch_list_items/diy_tasks updates. No delete policy
-- existed on task_completions before this — it was insert/select only.
create policy "task_completions_delete_authenticated"
  on task_completions for delete
  to authenticated
  using (true);
