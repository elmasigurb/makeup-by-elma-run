-- Core content schema for Makeup by Elma Rún.
-- Apply through the Supabase CLI or paste into the Dashboard SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.site_content (
  section_key text primary key,
  content jsonb not null default '{}'::jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id text primary key,
  title text not null,
  description text not null default '',
  price_text text not null default 'Price upon request',
  display_order integer not null default 0 check (display_order >= 0),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  description text not null default '',
  alt_text text not null default '',
  category text not null check (category in ('Bridal', 'Special Events', 'Studio', 'Shoots', 'Hair Styles', 'Editorial')),
  image_path text not null unique,
  display_order integer not null default 0 check (display_order >= 0),
  featured boolean not null default false,
  published boolean not null default false,
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists portfolio_items_published_order_idx
  on public.portfolio_items (published, display_order);

create index if not exists portfolio_items_category_order_idx
  on public.portfolio_items (category, display_order);

create index if not exists portfolio_items_featured_idx
  on public.portfolio_items (featured)
  where featured = true;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_site_content_updated_at on public.site_content;
create trigger set_site_content_updated_at
before update on public.site_content
for each row execute function public.set_updated_at();

drop trigger if exists set_services_updated_at on public.services;
create trigger set_services_updated_at
before update on public.services
for each row execute function public.set_updated_at();

drop trigger if exists set_portfolio_items_updated_at on public.portfolio_items;
create trigger set_portfolio_items_updated_at
before update on public.portfolio_items
for each row execute function public.set_updated_at();

insert into public.site_content (section_key, content, published)
values
  ('homepage', '{}'::jsonb, false),
  ('about', '{}'::jsonb, false),
  ('contact', '{}'::jsonb, false),
  ('settings', '{}'::jsonb, false)
on conflict (section_key) do nothing;
