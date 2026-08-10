-- Replaces the category-based shortlist filter and the opt-out
-- excluded_from_voting flag with a single opt-in "weekly meal" flag,
-- toggled directly from the meal library list.

alter table meals
  add column is_weekly_meal boolean not null default false;

alter table meals
  drop column excluded_from_voting;

alter table voting_cycles
  drop column category_ids;
