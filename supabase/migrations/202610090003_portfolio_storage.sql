-- Private image bucket. Published objects are readable through RLS; all
-- mutations require the user to be listed in public.admin_users.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'portfolio',
  'portfolio',
  false,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Published portfolio images are readable" on storage.objects;
create policy "Published portfolio images are readable"
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'portfolio'
  and exists (
    select 1
    from public.portfolio_items
    where portfolio_items.image_path = storage.objects.name
      and portfolio_items.published = true
  )
);

drop policy if exists "Admins can read all portfolio images" on storage.objects;
create policy "Admins can read all portfolio images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'portfolio'
  and (select public.is_admin())
);

drop policy if exists "Admins can upload portfolio images" on storage.objects;
create policy "Admins can upload portfolio images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'portfolio'
  and (select public.is_admin())
);

drop policy if exists "Admins can replace portfolio images" on storage.objects;
create policy "Admins can replace portfolio images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'portfolio'
  and (select public.is_admin())
)
with check (
  bucket_id = 'portfolio'
  and (select public.is_admin())
);

drop policy if exists "Admins can delete portfolio images" on storage.objects;
create policy "Admins can delete portfolio images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'portfolio'
  and (select public.is_admin())
);
