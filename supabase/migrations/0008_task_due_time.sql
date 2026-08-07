-- Optional time-of-day component for a task's due date. When null, the app
-- treats it as due at 20:00 (8pm) for overdue checks and reminders.

alter table tasks
  add column due_time time;
