-- Ullara-Eni 0008: housekeeping from Supabase's security advisor. Safe to run more than once.

-- Internal trigger functions should never be callable directly from the app.
revoke execute on function public.audit_attendance(), public.audit_pay_adjustments(), public.audit_profiles(),
  public.audit_settings(), public.office_secret_trg(), public.on_auth_user_deleted(), public.pay_adjustments_fill()
  from public, anon, authenticated;

-- Pin the search path on small helper functions.
alter function public.changed_fields(jsonb, jsonb, text[]) set search_path = public;
alter function public.distance_m(double precision, double precision, double precision, double precision) set search_path = public;
alter function public.is_late_at(timestamp, time, int) set search_path = public;
alter function public.session_aal() set search_path = public;
alter function public.pin_login_email(text, int) set search_path = public;
