-- Structured fields used by the Services & Pricing editor.
-- Existing services remain unpublished/published as-is and default to
-- "Price upon request" until an administrator sets a fixed ISK amount.

alter table public.services
  add column if not exists detailed_description text not null default '',
  add column if not exists price_isk integer,
  add column if not exists price_on_request boolean not null default true,
  add column if not exists duration_minutes integer,
  add column if not exists category text not null default '',
  add column if not exists booking_button_text text not null default '',
  add column if not exists booking_url text not null default '';

alter table public.services
  drop constraint if exists services_price_isk_check,
  add constraint services_price_isk_check
    check (price_isk is null or price_isk >= 0),
  drop constraint if exists services_fixed_price_check,
  add constraint services_fixed_price_check
    check (price_on_request or price_isk is not null),
  drop constraint if exists services_duration_minutes_check,
  add constraint services_duration_minutes_check
    check (duration_minutes is null or duration_minutes > 0);

create index if not exists services_published_order_idx
  on public.services (published, display_order);
