-- Optional link back to where a recipe originally came from (e.g. a BBC
-- Good Food or blog URL), shown as a reference link on the meal page.

alter table meals
  add column source_url text;
