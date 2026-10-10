-- Optional editorial details and professional credits for portfolio items.
-- This migration is additive: existing records, images, ordering, publication
-- state, indexes, triggers, grants, and Row Level Security policies are kept.

alter table public.portfolio_items
  add column if not exists subtitle text not null default '',
  add column if not exists makeup_artist text not null default '',
  add column if not exists photographer text not null default '',
  add column if not exists model_name text not null default '',
  add column if not exists hair_stylist text not null default '',
  add column if not exists stylist_creative_director text not null default '',
  add column if not exists location text not null default '',
  add column if not exists project_date date,
  add column if not exists additional_credits text not null default '';
