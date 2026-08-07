-- Tracks whether an overdue-task reminder email has already gone out for
-- the task's current due date, so the periodic check doesn't re-send one
-- every time it runs. Cleared when the task is completed (recurring tasks
-- go back to pending) or when its due date changes.

alter table tasks
  add column reminder_sent_at timestamptz;
