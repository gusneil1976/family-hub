-- Time-sensitive tasks (e.g. an alternating chore between two kids) need to
-- stay on their exact recurring cadence rather than the usual "roll
-- forward to today if missed" behavior — otherwise a single missed day
-- desyncs the alternation permanently. When set, the daily rollover cron
-- (src/app/api/cron/task-reminders/route.ts) auto-marks an overdue
-- occurrence as not completed (deducting points, same as the manual "Not
-- completed" button) and advances a recurring task to its next scheduled
-- date computed from the original due date, instead of bumping due_date to
-- today.
alter table tasks add column is_time_sensitive boolean not null default false;
grant update (is_time_sensitive) on tasks to authenticated;
