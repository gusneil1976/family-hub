-- Lets the admin mark a meal as never eligible for a shortlist draw (e.g. a
-- reference recipe kept in the library but not meant to be voted on).

alter table meals
  add column excluded_from_voting boolean not null default false;
