-- Draft isolation and private assets for the Homepage and About editors.
-- This migration adds new protected resources without changing existing RLS.

create table if not exists public.site_content_drafts (
  section_key text primary key references public.site_content(section_key) on delete cascade,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_site_content_drafts_updated_at on public.site_content_drafts;
create trigger set_site_content_drafts_updated_at
before update on public.site_content_drafts
for each row execute function public.set_updated_at();

insert into public.site_content_drafts (section_key, content)
select section_key, content from public.site_content
on conflict (section_key) do nothing;

alter table public.site_content_drafts enable row level security;
revoke all on table public.site_content_drafts from anon, authenticated;
grant select, insert, update, delete on table public.site_content_drafts to authenticated;

drop policy if exists "Admins can read page drafts" on public.site_content_drafts;
create policy "Admins can read page drafts"
on public.site_content_drafts for select
to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can insert page drafts" on public.site_content_drafts;
create policy "Admins can insert page drafts"
on public.site_content_drafts for insert
to authenticated
with check ((select public.is_admin()));

drop policy if exists "Admins can update page drafts" on public.site_content_drafts;
create policy "Admins can update page drafts"
on public.site_content_drafts for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins can delete page drafts" on public.site_content_drafts;
create policy "Admins can delete page drafts"
on public.site_content_drafts for delete
to authenticated
using ((select public.is_admin()));

create or replace function public.publish_site_content(p_section_key text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  draft_content jsonb;
begin
  if not (select public.is_admin()) then
    raise exception 'Administrator access required';
  end if;

  select content into draft_content
  from public.site_content_drafts
  where section_key = p_section_key;

  if not found then
    raise exception 'No draft exists for section %', p_section_key;
  end if;

  update public.site_content
  set content = draft_content,
      published = true
  where section_key = p_section_key;

  if not found then
    raise exception 'Unknown site content section %', p_section_key;
  end if;
end;
$$;

revoke all on function public.publish_site_content(text) from public;
revoke all on function public.publish_site_content(text) from anon;
grant execute on function public.publish_site_content(text) to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'site-assets',
  'site-assets',
  false,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Published site assets are readable" on storage.objects;
create policy "Published site assets are readable"
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'site-assets'
  and exists (
    select 1
    from public.site_content
    where published = true
      and (
        content #>> '{heroImage,path}' = storage.objects.name
        or content #>> '{portraitImage,path}' = storage.objects.name
      )
  )
);

drop policy if exists "Admins can read all site assets" on storage.objects;
create policy "Admins can read all site assets"
on storage.objects for select
to authenticated
using (bucket_id = 'site-assets' and (select public.is_admin()));

drop policy if exists "Admins can upload site assets" on storage.objects;
create policy "Admins can upload site assets"
on storage.objects for insert
to authenticated
with check (bucket_id = 'site-assets' and (select public.is_admin()));

drop policy if exists "Admins can replace site assets" on storage.objects;
create policy "Admins can replace site assets"
on storage.objects for update
to authenticated
using (bucket_id = 'site-assets' and (select public.is_admin()))
with check (bucket_id = 'site-assets' and (select public.is_admin()));

drop policy if exists "Admins can delete site assets" on storage.objects;
create policy "Admins can delete site assets"
on storage.objects for delete
to authenticated
using (bucket_id = 'site-assets' and (select public.is_admin()));
