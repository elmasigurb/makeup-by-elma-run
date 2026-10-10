-- Private booking inquiries with admin-only access.
-- Anonymous submissions must pass through the submit-booking-inquiry Edge
-- Function. No table or RPC privileges are granted to anon users.

create table if not exists public.booking_inquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (char_length(email) between 3 and 254),
  phone text not null default '' check (char_length(phone) <= 40),
  service_id text references public.services(id) on delete set null,
  service_name text not null default '' check (char_length(service_name) <= 160),
  preferred_date date,
  preferred_time time,
  location text not null default '' check (char_length(location) <= 240),
  message text not null default '' check (char_length(message) <= 5000),
  privacy_consent_at timestamptz not null,
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'confirmed', 'declined')),
  admin_notes text not null default '' check (char_length(admin_notes) <= 10000),
  submission_fingerprint text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inquiry_rate_limits (
  id bigint generated always as identity primary key,
  rate_key_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists booking_inquiries_status_created_idx
  on public.booking_inquiries (status, created_at desc);
create index if not exists booking_inquiries_created_idx
  on public.booking_inquiries (created_at desc);
create index if not exists booking_inquiries_fingerprint_idx
  on public.booking_inquiries (submission_fingerprint, created_at desc);
create index if not exists inquiry_rate_limits_key_created_idx
  on public.inquiry_rate_limits (rate_key_hash, created_at desc);

drop trigger if exists set_booking_inquiries_updated_at on public.booking_inquiries;
create trigger set_booking_inquiries_updated_at
before update on public.booking_inquiries
for each row execute function public.set_updated_at();

alter table public.booking_inquiries enable row level security;
alter table public.inquiry_rate_limits enable row level security;

revoke all on table public.booking_inquiries from anon, authenticated;
revoke all on table public.inquiry_rate_limits from anon, authenticated;
revoke all on sequence public.inquiry_rate_limits_id_seq from anon, authenticated;

grant select, update, delete on table public.booking_inquiries to authenticated;

drop policy if exists "Admins can read booking inquiries" on public.booking_inquiries;
create policy "Admins can read booking inquiries"
on public.booking_inquiries for select
to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can update booking inquiries" on public.booking_inquiries;
create policy "Admins can update booking inquiries"
on public.booking_inquiries for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins can delete booking inquiries" on public.booking_inquiries;
create policy "Admins can delete booking inquiries"
on public.booking_inquiries for delete
to authenticated
using ((select public.is_admin()));

create or replace function public.accept_booking_inquiry(
  p_full_name text,
  p_email text,
  p_phone text,
  p_service_id text,
  p_service_name text,
  p_preferred_date date,
  p_preferred_time time,
  p_location text,
  p_message text,
  p_privacy_consent_at timestamptz,
  p_rate_key_hash text,
  p_submission_fingerprint text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  inquiry_id uuid;
begin
  -- Serialize matching fingerprints so simultaneous duplicate requests cannot
  -- both pass the recent-submission check.
  perform pg_advisory_xact_lock(hashtextextended(p_submission_fingerprint, 0));

  delete from public.inquiry_rate_limits
  where created_at < now() - interval '24 hours';

  if (
    select count(*)
    from public.inquiry_rate_limits
    where rate_key_hash = p_rate_key_hash
      and created_at >= now() - interval '1 hour'
  ) >= 5 then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  end if;

  if exists (
    select 1
    from public.booking_inquiries
    where submission_fingerprint = p_submission_fingerprint
      and created_at >= now() - interval '15 minutes'
  ) then
    raise exception using errcode = 'P0001', message = 'duplicate_submission';
  end if;

  insert into public.inquiry_rate_limits (rate_key_hash)
  values (p_rate_key_hash);

  insert into public.booking_inquiries (
    full_name,
    email,
    phone,
    service_id,
    service_name,
    preferred_date,
    preferred_time,
    location,
    message,
    privacy_consent_at,
    submission_fingerprint
  ) values (
    p_full_name,
    p_email,
    p_phone,
    p_service_id,
    p_service_name,
    p_preferred_date,
    p_preferred_time,
    p_location,
    p_message,
    p_privacy_consent_at,
    p_submission_fingerprint
  )
  returning id into inquiry_id;

  return inquiry_id;
end;
$$;

revoke all on function public.accept_booking_inquiry(
  text, text, text, text, text, date, time, text, text, timestamptz, text, text
) from public, anon, authenticated;
grant execute on function public.accept_booking_inquiry(
  text, text, text, text, text, date, time, text, text, timestamptz, text, text
) to service_role;

