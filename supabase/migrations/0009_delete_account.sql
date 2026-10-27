-- Ullara-Eni 0009: people can delete their own account. Safe to run more than once.
-- The "delete-account" Edge Function calls this as the person, then removes their login.
-- Attendance and pay records stay with the company (needed for payroll); the person is marked removed.

create or replace function public.prepare_account_deletion() returns text
language plpgsql volatile security definer set search_path = public as $$
declare me profiles;
begin
  if auth.uid() is null then raise exception 'NOT_SIGNED_IN'; end if;
  select * into me from profiles where id = auth.uid();
  if me.id is null then return 'no_profile'; end if;

  if me.pin_login then raise exception 'PIN_ACCOUNT'; end if;

  if me.role = 'admin' and me.active and not exists (
    select 1 from profiles o where o.company_id = me.company_id and o.id <> me.id and o.role = 'admin' and o.active
  ) and exists (
    select 1 from profiles o where o.company_id = me.company_id and o.id <> me.id and o.active
  ) then
    raise exception 'LAST_ADMIN';
  end if;

  insert into activity_log (company_id, actor, action, person, details)
  values (me.company_id, me.id, 'person.account_deleted', me.id, jsonb_build_object('name', me.full_name));

  -- A request that was never approved, or a company with nobody else in it, is removed outright.
  if not me.approved then
    delete from profiles where id = me.id;
    return 'request_removed';
  end if;
  -- If nobody else active is left, the company would be unreachable, so it is removed with everything in it.
  if not exists (select 1 from profiles o where o.company_id = me.company_id and o.id <> me.id and o.active and o.approved) then
    delete from companies where id = me.company_id;   -- cascades to its sites, shifts and records
    return 'company_removed';
  end if;

  update profiles set active = false, has_login = false, role = case when role = 'admin' then 'employee' else role end
  where id = me.id;
  return 'deactivated';
end $$;

revoke execute on function public.prepare_account_deletion() from public, anon;
grant execute on function public.prepare_account_deletion() to authenticated;

-- Tells the Account page what deleting will do, before the person confirms.
create or replace function public.account_deletion_preview()
returns table (outcome text, company_name text, others int)
language plpgsql stable security definer set search_path = public as $$
declare me profiles; n int; cname text;
begin
  select * into me from profiles where id = auth.uid();
  if me.id is null then outcome := 'no_profile'; others := 0; return next; return; end if;
  select name into cname from companies where id = me.company_id;
  select count(*) into n from profiles o where o.company_id = me.company_id and o.id <> me.id and o.active and o.approved;
  company_name := cname;
  others := n;
  outcome := case
    when me.pin_login then 'pin_account'
    when not me.approved then 'request_removed'
    when n = 0 then 'company_removed'
    when me.role = 'admin' and me.active and not exists (
      select 1 from profiles o where o.company_id = me.company_id and o.id <> me.id and o.role = 'admin' and o.active
    ) and exists (select 1 from profiles o where o.company_id = me.company_id and o.id <> me.id and o.active) then 'last_admin'
    else 'deactivated' end;
  return next;
end $$;

revoke execute on function public.account_deletion_preview() from public, anon;
grant execute on function public.account_deletion_preview() to authenticated;
