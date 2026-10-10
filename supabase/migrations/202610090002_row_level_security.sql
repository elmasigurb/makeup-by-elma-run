-- Database authorization. The browser only receives a publishable key;
-- administrator rights come from this allowlist and these RLS policies.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

alter table public.admin_users enable row level security;
alter table public.site_content enable row level security;
alter table public.services enable row level security;
alter table public.portfolio_items enable row level security;

revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

revoke all on table public.site_content from anon, authenticated;
revoke all on table public.services from anon, authenticated;
revoke all on table public.portfolio_items from anon, authenticated;

grant select on table public.site_content, public.services, public.portfolio_items to anon, authenticated;
grant insert, update, delete on table public.site_content, public.services, public.portfolio_items to authenticated;

drop policy if exists "Admins can read their own allowlist entry" on public.admin_users;
create policy "Admins can read their own allowlist entry"
on public.admin_users for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Published site content is public" on public.site_content;
create policy "Published site content is public"
on public.site_content for select
to anon, authenticated
using (published = true);

drop policy if exists "Admins can read all site content" on public.site_content;
create policy "Admins can read all site content"
on public.site_content for select
to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can insert site content" on public.site_content;
create policy "Admins can insert site content"
on public.site_content for insert
to authenticated
with check ((select public.is_admin()));

drop policy if exists "Admins can update site content" on public.site_content;
create policy "Admins can update site content"
on public.site_content for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins can delete site content" on public.site_content;
create policy "Admins can delete site content"
on public.site_content for delete
to authenticated
using ((select public.is_admin()));

drop policy if exists "Published services are public" on public.services;
create policy "Published services are public"
on public.services for select
to anon, authenticated
using (published = true);

drop policy if exists "Admins can read all services" on public.services;
create policy "Admins can read all services"
on public.services for select
to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can insert services" on public.services;
create policy "Admins can insert services"
on public.services for insert
to authenticated
with check ((select public.is_admin()));

drop policy if exists "Admins can update services" on public.services;
create policy "Admins can update services"
on public.services for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins can delete services" on public.services;
create policy "Admins can delete services"
on public.services for delete
to authenticated
using ((select public.is_admin()));

drop policy if exists "Published portfolio items are public" on public.portfolio_items;
create policy "Published portfolio items are public"
on public.portfolio_items for select
to anon, authenticated
using (published = true);

drop policy if exists "Admins can read all portfolio items" on public.portfolio_items;
create policy "Admins can read all portfolio items"
on public.portfolio_items for select
to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can insert portfolio items" on public.portfolio_items;
create policy "Admins can insert portfolio items"
on public.portfolio_items for insert
to authenticated
with check ((select public.is_admin()));

drop policy if exists "Admins can update portfolio items" on public.portfolio_items;
create policy "Admins can update portfolio items"
on public.portfolio_items for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins can delete portfolio items" on public.portfolio_items;
create policy "Admins can delete portfolio items"
on public.portfolio_items for delete
to authenticated
using ((select public.is_admin()));
