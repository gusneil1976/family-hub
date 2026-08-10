-- Curing Projects step scheduling upgrade: offsets/intervals can now be
-- denominated in hours/days/weeks (not just days), and a template step can
-- be scheduled relative to the previous step instead of always from the
-- project's start date. That's needed to chain a step after an indefinite
-- recurring step (e.g. "rotate daily until done" -> "dry age, starting the
-- day after rotate finishes"), whose actual end date isn't known until you
-- complete it. See src/app/(app)/curing/expand-steps.ts for how these are
-- resolved, including the `pending_chain` deferral for that indefinite case.

alter table baking_template_steps rename column offset_days to offset_value;
alter table baking_template_steps
  add column offset_unit text not null default 'days'
    check (offset_unit in ('hours', 'days', 'weeks')),
  add column relative_to_previous boolean not null default false;

alter table baking_template_steps rename column recurrence_interval_days to recurrence_interval_value;
alter table baking_template_steps
  add column recurrence_interval_unit text
    check (recurrence_interval_unit in ('hours', 'days', 'weeks'));
update baking_template_steps set recurrence_interval_unit = 'days'
  where recurrence_interval_value is not null;

alter table baking_project_steps rename column recurrence_interval_days to recurrence_interval_value;
alter table baking_project_steps
  add column recurrence_interval_unit text
    check (recurrence_interval_unit in ('hours', 'days', 'weeks')),
  add column due_time time,
  -- Set only on an indefinite-recurring step that has one or more
  -- not-yet-materialized "relative to previous" steps waiting after it.
  -- Resolved into real rows (and cleared) when that step is finished
  -- (Complete, not Complete & repeat) — see toggleStepComplete.
  add column pending_chain jsonb;
update baking_project_steps set recurrence_interval_unit = 'days'
  where recurrence_interval_value is not null;
