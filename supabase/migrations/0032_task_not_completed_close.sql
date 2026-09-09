-- "Not completed" currently only ever deducts points and leaves the task
-- exactly as it was — useful when someone else can still pick it up today,
-- but wrong for a task where the moment has genuinely passed (e.g. one half
-- of an alternating chore): leaving it open lets it get done "late" and
-- desync the alternation right back, the same failure time-sensitive tasks
-- (0031) were built to avoid. closed_task records which kind a given
-- not-completed entry was, so uncompleteTask knows whether it also needs to
-- unwind a due_date advance / completed_at, the same way it already does for
-- a real completion.
alter table task_completions add column closed_task boolean not null default false;
