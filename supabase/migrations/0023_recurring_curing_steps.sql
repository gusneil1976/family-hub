-- Recurring Curing Projects steps: a template step can now repeat every N
-- days, either a fixed number of times (fully expanded into concrete
-- project steps at project-creation time) or indefinitely (only the next
-- occurrence exists at any time; completing it decides whether another gets
-- scheduled). See src/app/(app)/curing/ for how these fields are used.

alter table baking_template_steps
  add column recurrence_interval_days int,
  add column recurrence_count int;

alter table baking_template_steps
  add constraint baking_template_steps_recurrence_interval_positive
    check (recurrence_interval_days is null or recurrence_interval_days > 0),
  add constraint baking_template_steps_recurrence_count_positive
    check (recurrence_count is null or recurrence_count > 0),
  add constraint baking_template_steps_recurrence_count_needs_interval
    check (recurrence_count is null or recurrence_interval_days is not null);

-- Set only on the current, not-yet-completed head of an indefinite series —
-- tells the UI to offer "Complete" vs "Complete & repeat" instead of a
-- plain checkbox. Bounded-recurrence project steps are plain rows with no
-- recurrence metadata, same as any other generated step.
alter table baking_project_steps
  add column recurrence_interval_days int;

alter table baking_project_steps
  add constraint baking_project_steps_recurrence_interval_positive
    check (recurrence_interval_days is null or recurrence_interval_days > 0);
