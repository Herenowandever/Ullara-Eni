-- Ullara-Eni 0007: worker sign-in with a Company code + Worker ID + 6-digit PIN (no email needed).
-- Safe to run more than once. Run after 0006.
--
-- How it works: each company gets a permanent login code, and each worker an ID number (101, 102, …).
-- An admin sets the PIN from the Team page; the "worker-login" Edge Function then creates or updates a
-- private login for that worker. Workers sign in with code + ID + PIN; no email is ever sent.

------------------------------------------------------------------------------
-- Company login code (permanent, unlike the join code, which admins can change)
------------------------------------------------------------------------------

alter table public.companies add column if not exists login_code text;
update public.companies set login_code = public.gen_code(6) where login_code is null;
alter table public.companies alter column login_code set default public.gen_code(6);
alter table public.companies alter column login_code set not null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'companies_login_code_key') then
    alter table public.companies add constraint companies_login_code_key unique (login_code);
  end if;
end $$;

------------------------------------------------------------------------------
-- Worker ID numbers and PIN logins
------------------------------------------------------------------------------

alter table public.profiles add column if not exists employee_no int check (employee_no between 1 and 999999);
alter table public.profiles add column if not exists pin_login boolean not null default false;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_company_employee_no_key') then
    alter table public.profiles add constraint profiles_company_employee_no_key unique (company_id, employee_no);
  end if;
end $$;

-- The private sign-in address the app derives from code + ID. It never receives email.
create or replace function public.pin_login_email(p_login_code text, p_employee_no int) returns text
language sql immutable as $$
  select 'w' || p_employee_no::text || '.' || lower(p_login_code) || '@pin.ullara-eni.app'
$$;

-- Called (with the admin's own sign-in) by the worker-login Edge Function before it sets a PIN.
-- Checks the caller is an admin of the worker's company, gives the worker an ID if they don't
-- have one, and returns what the function needs.
create or replace function public.admin_prepare_pin_login(p_member uuid)
returns table (member_id uuid, employee_no int, login_code text, login_email text, full_name text)
language plpgsql volatile security definer set search_path = public as $$
declare target profiles; co companies; next_no int;
begin
  if not is_admin() then raise exception 'ADMIN_ONLY'; end if;
  select * into target from profiles where id = p_member and company_id = my_company_id() for update;
  if target.id is null then raise exception 'NOT_FOUND'; end if;
  if not target.active or not target.approved then raise exception 'NOT_ACTIVE'; end if;
  if target.has_login and not target.pin_login then raise exception 'HAS_OWN_LOGIN'; end if;
  select * into co from companies where id = target.company_id;

  if target.employee_no is null then
    perform pg_advisory_xact_lock(hashtext('employee_no:' || co.id::text));
    select greatest(coalesce(max(p.employee_no), 100), 100) + 1 into next_no from profiles p where p.company_id = co.id;
    update profiles set employee_no = next_no where id = target.id;
    target.employee_no := next_no;
  end if;

  member_id := target.id;
  employee_no := target.employee_no;
  login_code := co.login_code;
  login_email := pin_login_email(co.login_code, target.employee_no);
  full_name := target.full_name;
  return next;
end $$;

-- Called by the Edge Function (with the service key) once the login exists.
create or replace function public.mark_pin_login(p_member uuid, p_actor uuid) returns void
language plpgsql security definer set search_path = public as $$
declare target profiles;
begin
  select * into target from profiles where id = p_member;
  if target.id is null then raise exception 'NOT_FOUND'; end if;
  update profiles set has_login = true, pin_login = true where id = p_member;
  insert into activity_log (company_id, actor, action, person, details)
  values (target.company_id, p_actor, case when target.pin_login then 'person.pin_reset' else 'person.pin_created' end,
          p_member, jsonb_build_object('name', target.full_name, 'employee_no', target.employee_no));
end $$;

-- Everyone in the company can see the company's login code (it's printed on worker cards).
create or replace function public.my_login_code() returns text
language sql stable security definer set search_path = public as $$
  select login_code from companies where id = my_company_id()
$$;

------------------------------------------------------------------------------
-- Permissions
------------------------------------------------------------------------------

revoke execute on all functions in schema public from public, anon;
revoke execute on function public.mark_pin_login(uuid, uuid) from authenticated;
grant execute on function public.mark_pin_login(uuid, uuid) to service_role;
grant execute on function public.expired_photos(int), public.forget_photos(uuid[]) to service_role;
revoke execute on function public.expired_photos(int), public.forget_photos(uuid[]),
  public.log_activity(uuid, text, uuid, jsonb), public.qr_code_for(uuid, date), public.verify_presence(uuid, date,
  double precision, double precision, double precision, text) from authenticated;
grant execute on function
  public.pin_login_email(text, int), public.admin_prepare_pin_login(uuid), public.my_login_code()
to authenticated;
