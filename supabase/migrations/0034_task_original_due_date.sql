-- The daily rollover cron (src/app/api/cron/task-reminders/route.ts) bumps
-- an overdue task's due_date forward to today so the board doesn't show
-- stale dates piling up — but that overwrites the date it was actually
-- meant to happen, with nothing left to show it slipped. original_due_date
-- captures that: set to the task's own due_date the first time it rolls
-- over (left alone on any further rollover, so a task missed several days
-- running still shows when it was *first* due, not yesterday), and cleared
-- again whenever the task moves on for real — completed, closed out via
-- "not completed", or given a fresh due date by hand.
alter table tasks add column original_due_date date;
grant update (original_due_date) on tasks to authenticated;
