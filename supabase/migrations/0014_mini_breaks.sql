-- Mini Breaks: fourth mini-app, placeholder only for now. Same privacy
-- model as Spend Tracker — private to whoever has this flag (Gus and Anna),
-- not just feature-gated: no hub tile, no sidebar entry, direct navigation
-- redirected away for anyone else.

alter table profiles
  add column has_mini_breaks_access boolean not null default false;
