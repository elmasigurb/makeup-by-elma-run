-- Run after migration 006. These assertions verify that inquiry data and the
-- intake RPC are not directly accessible to public or ordinary authenticated
-- clients. A raised exception means the security contract is not satisfied.

do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.booking_inquiries'::regclass) then
    raise exception 'booking_inquiries RLS is not enabled';
  end if;

  if has_table_privilege('anon', 'public.booking_inquiries', 'select')
     or has_table_privilege('anon', 'public.booking_inquiries', 'insert')
     or has_table_privilege('anon', 'public.booking_inquiries', 'update')
     or has_table_privilege('anon', 'public.booking_inquiries', 'delete') then
    raise exception 'anon has direct booking_inquiries privileges';
  end if;

  if has_table_privilege('authenticated', 'public.booking_inquiries', 'insert') then
    raise exception 'authenticated has direct booking inquiry insert access';
  end if;

  if has_function_privilege(
    'anon',
    'public.accept_booking_inquiry(text,text,text,text,text,date,time,text,text,timestamptz,text,text)',
    'execute'
  ) or has_function_privilege(
    'authenticated',
    'public.accept_booking_inquiry(text,text,text,text,text,date,time,text,text,timestamptz,text,text)',
    'execute'
  ) then
    raise exception 'public clients can execute the private inquiry intake RPC';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.accept_booking_inquiry(text,text,text,text,text,date,time,text,text,timestamptz,text,text)',
    'execute'
  ) then
    raise exception 'service_role cannot execute the inquiry intake RPC';
  end if;
end;
$$;
