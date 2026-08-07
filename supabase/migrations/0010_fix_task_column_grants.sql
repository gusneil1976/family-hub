-- Migrations 0008 (due_time) and 0009 (reminder_sent_at) added columns to
-- tasks, but the column-level UPDATE grant from migration 0007 — which
-- explicitly lists which columns non-admins may write — was never updated
-- to include them. completeTask() always clears reminder_sent_at, so every
-- "Complete" click was being rejected by Postgres with a permission error.

grant update (due_time, reminder_sent_at) on tasks to authenticated;
