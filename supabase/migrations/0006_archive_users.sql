-- Lets the admin archive a family member (reversible: blocks login without
-- deleting them or their history) as a safer alternative to permanent
-- removal, which is only possible for someone with no meals/votes on record.

alter table profiles
  add column is_archived boolean not null default false;
