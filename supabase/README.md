# Supabase setup

The migration files in `supabase/migrations` create the content tables, the
administrator allowlist, Row Level Security policies, and the private
`portfolio` and `site-assets` Storage buckets. The fourth migration adds
admin-only page drafts and the Homepage/About publishing function.

No secret or service-role key belongs in this Vite project. The browser uses
only the project URL and a publishable key; database and Storage permissions are
enforced by RLS.

## Apply the migrations

Use either the Supabase CLI migration workflow or paste all migration files
into the Supabase Dashboard SQL Editor in filename order. For an existing
project that already has the first three migrations, apply only:

```text
202610100004_page_drafts_and_site_assets.sql
```

This is additive: it does not replace or loosen the existing content,
portfolio, or Storage policies. It creates:

- `site_content_drafts`, readable and writable only by allowlisted admins
- `publish_site_content(section_key)`, which copies a draft into public content
- the private `site-assets` bucket for hero and portrait uploads
- a read policy exposing an asset only while published content references it

For the Services & Pricing editor, also apply:

```text
202610100005_service_editor_fields.sql
```

This migration adds structured service details and pricing fields to the
existing `services` table. It does not replace the table or alter its existing
admin-only write and published-only public read policies.

For editable portfolio project details and professional credits, apply:

```text
202610100007_portfolio_project_details.sql
```

This additive migration adds optional subtitle, credit, location, date, and
additional-credit fields to `portfolio_items`. Existing portfolio records,
images, ordering, featured state, publication state, Storage policies, and RLS
policies are preserved. Apply it before editing or saving the new credit fields.

## Booking inquiries

Apply the inquiry migration after the earlier migrations:

```text
202610100006_booking_inquiries.sql
```

It creates the private `booking_inquiries` and `inquiry_rate_limits` tables and
an intake function executable only by Supabase's server-side `service_role`.
Anonymous visitors have no direct table or RPC access. Existing admin access is
reused through `is_admin()`.

Run `supabase/tests/booking_inquiries_security.sql` in the SQL Editor after the
migration. It raises an error if anonymous or ordinary authenticated clients
have unsafe direct privileges.

### Configure and deploy the submission endpoint

The public form calls the `submit-booking-inquiry` Edge Function. Before
deployment, set these production secrets in **Edge Function Secrets**:

```text
ALLOWED_ORIGINS=https://www.makeupbyelmarun.com
INQUIRY_HASH_SALT=<a-long-random-value>
```

`INQUIRY_HASH_SALT` is used to hash rate-limit and duplicate-detection keys. Do
not reuse a password or expose this value in Vite environment variables.

Deploy the function using the Supabase Dashboard or CLI:

```sh
supabase functions deploy submit-booking-inquiry
```

The function is intentionally public (`verify_jwt = false` in `config.toml`),
but it validates and limits every request before using Supabase's automatically
provided server credential. The browser never receives that credential.

### Optional email notifications with Resend

1. Create a Resend account and verify a sending domain.
2. Create a restricted Resend API key.
3. Add the following Edge Function secrets:

```text
RESEND_API_KEY=<your-resend-api-key>
BOOKING_NOTIFICATION_TO=<your-business-recipient-email>
BOOKING_NOTIFICATION_FROM=Website <bookings@your-verified-domain>
```

If these three values are absent, inquiries are still saved but no email is
attempted. After configuring them, submit a controlled test inquiry, confirm it
appears under `/admin/inquiries`, check the Edge Function logs for a successful
provider response, and confirm receipt in the destination inbox before treating
email notifications as active.

For local Edge Function development, copy
`supabase/functions/.env.example` to `supabase/functions/.env`. The real `.env`
file is ignored and must never be committed.

## Create the administrator

1. In **Authentication → Providers → Email**, disable **Allow new users to sign up**.
2. Also leave anonymous sign-ins disabled.
3. In **Authentication → Users**, create the single email/password user that
   should administer this site.
4. Copy that user's UUID.
5. In the SQL Editor, run the following after replacing the example UUID:

```sql
insert into public.admin_users (user_id)
values ('YOUR-AUTH-USER-UUID');
```

Do not put the email address, password, UUID, secret key, or service-role key in
the frontend source.

## Connect the Vite app

Copy `.env.example` to `.env.local` and fill in values from the project's
**Connect** dialog:

```text
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Restart the Vite development server after changing environment variables.
