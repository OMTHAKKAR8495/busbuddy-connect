-- Security baseline. Apply after the legacy schema has been backed up.
begin;

alter type public.app_role add value if not exists 'scanner';

create table if not exists public.allowed_email_domains (
  domain text primary key check (domain = lower(domain) and domain ~ '^[a-z0-9.-]{1,253}$')
);
insert into public.allowed_email_domains(domain) values ('gsfcuniversity.ac.in') on conflict do nothing;
revoke all on public.allowed_email_domains from anon, authenticated, public;

create or replace function public.enforce_signup_domain()
returns trigger language plpgsql security definer set search_path = public as $$
declare email_domain text;
begin
  email_domain := lower(split_part(coalesce(new.email, ''), '@', 2));
  if email_domain = '' or not exists (
    select 1 from public.allowed_email_domains where domain = email_domain
  ) then raise exception 'Signup email domain is not allowed'; end if;
  return new;
end;
$$;
drop trigger if exists enforce_signup_domain on auth.users;
create trigger enforce_signup_domain before insert on auth.users
for each row execute function public.enforce_signup_domain();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name) values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name', ''), 120))
  on conflict (id) do nothing;
  insert into public.user_roles(user_id, role) values (new.id, 'student') on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;
revoke execute on function public.enforce_signup_domain() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- No authenticated client can modify role assignments. Assignment is service-only.
alter table public.user_roles enable row level security;
drop policy if exists user_roles_admin_all on public.user_roles;
drop policy if exists user_roles_select_own on public.user_roles;
revoke all on public.user_roles from anon, authenticated, public;
grant select on public.user_roles to authenticated;
create policy user_roles_read_self_or_admin on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Clear permissive historical policies before recreating least-privilege access.
do $$ declare p record; begin
  for p in select schemaname, tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- RLS is enabled and privileges revoked for every current public table by default.
do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
    execute format('alter table public.%I force row level security', t.tablename);
    execute format('revoke all on public.%I from anon, authenticated, public', t.tablename);
  end loop;
end $$;
grant select on public.user_roles to authenticated;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
revoke all on public.profiles from anon, public;
grant select, update on public.profiles to authenticated;
create policy profiles_read_self_or_admin on public.profiles for select to authenticated
  using (id = auth.uid() or (public.has_role(auth.uid(), 'admin') and (auth.jwt()->>'aal') = 'aal2'));
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Prevent changing protected identity attributes even when updating one's own profile.
create or replace function public.protect_profile_identity()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.id <> old.id or new.roll_number is distinct from old.roll_number then
    raise exception 'Profile identity fields cannot be changed';
  end if;
  return new;
end;
$$;
drop trigger if exists protect_profile_identity on public.profiles;
create trigger protect_profile_identity before update on public.profiles
for each row execute function public.protect_profile_identity();
revoke execute on function public.protect_profile_identity() from public, anon, authenticated;
alter table public.profiles drop constraint if exists profiles_full_name_length;
alter table public.profiles add constraint profiles_full_name_length check (length(full_name) between 1 and 120) not valid;
alter table public.profiles drop constraint if exists profiles_roll_number_format;
alter table public.profiles add constraint profiles_roll_number_format check (roll_number is null or roll_number ~ '^[A-Za-z0-9/-]{2,32}$') not valid;
alter table public.profiles drop constraint if exists profiles_phone_format;
alter table public.profiles add constraint profiles_phone_format check (phone is null or phone ~ '^\+?[0-9][0-9 ()-]{6,24}$') not valid;
alter table public.profiles drop constraint if exists profiles_photo_storage_path;
alter table public.profiles add constraint profiles_photo_storage_path check (photo_url is null or (length(photo_url) <= 512 and photo_url !~* '^https?://' and photo_url !~* '^data:')) not valid;

-- Authenticated users can read transit reference data; only MFA admins write it.
do $$ declare t text; begin
  foreach t in array array['routes','stops','buses','alerts'] loop
    if to_regclass('public.'||t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('alter table public.%I force row level security', t);
      execute format('revoke all on public.%I from anon, public', t);
      execute format('grant select on public.%I to authenticated', t);
      execute format('create policy %I on public.%I for select to authenticated using (auth.uid() is not null)', t||'_authenticated_read', t);
      execute format('grant insert, update, delete on public.%I to authenticated', t);
      execute format('create policy %I on public.%I for all to authenticated using (public.has_role(auth.uid(), ''admin'') and (auth.jwt()->>''aal'') = ''aal2'') with check (public.has_role(auth.uid(), ''admin'') and (auth.jwt()->>''aal'') = ''aal2'')', t||'_admin_mfa_write', t);
    end if;
  end loop;
end $$;
create policy alerts_driver_own_route_insert on public.alerts for insert to authenticated
  with check (public.has_role(auth.uid(), 'driver') and driver_id = auth.uid() and exists(
    select 1 from public.buses b where b.driver_id = auth.uid() and b.route_id = alerts.route_id
  ));

grant select, insert, update on public.trips to authenticated;
create policy trips_driver_read on public.trips for select to authenticated using (driver_id = auth.uid());
create policy trips_driver_start on public.trips for insert to authenticated with check (
  driver_id = auth.uid() and exists(select 1 from public.buses b where b.id = trips.bus_id and b.driver_id = auth.uid() and b.route_id = trips.route_id)
);
create policy trips_driver_update on public.trips for update to authenticated
  using (driver_id = auth.uid()) with check (driver_id = auth.uid());
create policy trips_admin_mfa on public.trips for all to authenticated
  using (public.has_role(auth.uid(), 'admin') and (auth.jwt()->>'aal') = 'aal2')
  with check (public.has_role(auth.uid(), 'admin') and (auth.jwt()->>'aal') = 'aal2');

-- Passes remain private to their owner and MFA-authenticated administrators.
alter table public.bus_passes enable row level security;
alter table public.bus_passes force row level security;
revoke all on public.bus_passes from anon, public;
grant select on public.bus_passes to authenticated;
create policy passes_owner_or_mfa_admin on public.bus_passes for select to authenticated
  using (student_id = auth.uid() or (public.has_role(auth.uid(), 'admin') and (auth.jwt()->>'aal') = 'aal2'));

create table if not exists public.pass_applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  route_id uuid not null references public.routes(id),
  pickup_stop_id uuid references public.stops(id),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  check (created_at <= now() + interval '5 minutes')
);
create index if not exists pass_applications_student_created_idx on public.pass_applications(student_id, created_at desc);
alter table public.pass_applications enable row level security;
alter table public.pass_applications force row level security;
revoke all on public.pass_applications from anon, public;
grant select, insert on public.pass_applications to authenticated;
create policy applications_owner_read_insert on public.pass_applications for select to authenticated using (student_id = auth.uid());
create policy applications_owner_insert on public.pass_applications for insert to authenticated with check (student_id = auth.uid());
create policy applications_mfa_admin_read on public.pass_applications for select to authenticated
  using (public.has_role(auth.uid(), 'admin') and (auth.jwt()->>'aal') = 'aal2');

create table if not exists public.driver_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  licence_number text not null check (length(licence_number) between 4 and 64),
  blood_group text check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  emergency_contact text check (length(emergency_contact) between 7 and 32),
  employee_id text not null unique check (length(employee_id) between 2 and 32)
);
alter table public.driver_profiles enable row level security;
alter table public.driver_profiles force row level security;
revoke all on public.driver_profiles from anon, public;
grant select on public.driver_profiles to authenticated;
create policy driver_profile_self_or_admin on public.driver_profiles for select to authenticated
  using (user_id = auth.uid() or (public.has_role(auth.uid(), 'admin') and (auth.jwt()->>'aal') = 'aal2'));

alter table public.bus_locations enable row level security;
alter table public.bus_locations force row level security;
alter table public.bus_locations drop constraint if exists bus_locations_lat_range;
alter table public.bus_locations add constraint bus_locations_lat_range check (lat between -90 and 90);
alter table public.bus_locations drop constraint if exists bus_locations_lng_range;
alter table public.bus_locations add constraint bus_locations_lng_range check (lng between -180 and 180);
revoke all on public.bus_locations from anon, public;
grant select, insert on public.bus_locations to authenticated;
create policy bus_locations_driver_insert on public.bus_locations for insert to authenticated
  with check (exists(select 1 from public.buses b where b.id = bus_id and b.driver_id = auth.uid()) and recorded_at > now() - interval '60 seconds');
create policy bus_locations_admin_read on public.bus_locations for select to authenticated
  using (public.has_role(auth.uid(), 'admin') and (auth.jwt()->>'aal') = 'aal2');
create policy bus_locations_pass_route_read on public.bus_locations for select to authenticated using (
  exists(select 1 from public.bus_passes p join public.buses b on b.route_id = p.route_id
    where p.student_id = auth.uid() and p.route_id = b.route_id and b.id = bus_id and p.status = 'active')
);

create table if not exists public.pass_scans (
  id bigint generated always as identity primary key,
  pass_id uuid,
  scanner_id uuid not null references auth.users(id),
  bus_id uuid references public.buses(id),
  route_id uuid references public.routes(id),
  result boolean not null,
  reason text check (reason is null or length(reason) <= 240),
  ip inet,
  created_at timestamptz not null default now()
);
create index if not exists pass_scans_created_route_idx on public.pass_scans(created_at desc, route_id);
alter table public.pass_scans enable row level security;
alter table public.pass_scans force row level security;
revoke all on public.pass_scans from anon, public;
grant select on public.pass_scans to authenticated;
create policy pass_scans_admin_read on public.pass_scans for select to authenticated
  using (public.has_role(auth.uid(), 'admin') and (auth.jwt()->>'aal') = 'aal2');

create table if not exists public.driver_shifts (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references auth.users(id),
  bus_id uuid references public.buses(id),
  route_id uuid references public.routes(id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  check (ended_at is null or ended_at >= started_at)
);
create index if not exists driver_shifts_created_route_idx on public.driver_shifts(started_at desc, route_id);
alter table public.driver_shifts enable row level security;
alter table public.driver_shifts force row level security;
revoke all on public.driver_shifts from anon, public;
grant select, insert, update on public.driver_shifts to authenticated;
create policy shifts_driver_or_mfa_admin on public.driver_shifts for all to authenticated
  using (driver_id = auth.uid() or (public.has_role(auth.uid(), 'admin') and (auth.jwt()->>'aal') = 'aal2'))
  with check (driver_id = auth.uid() or (public.has_role(auth.uid(), 'admin') and (auth.jwt()->>'aal') = 'aal2'));

create table if not exists public.used_qr_tokens (
  jti text primary key check (length(jti) = 32),
  expires_at timestamptz not null
);
alter table public.used_qr_tokens enable row level security;
alter table public.used_qr_tokens force row level security;
revoke all on public.used_qr_tokens from anon, authenticated, public;

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  action text not null check (length(action) between 1 and 80),
  subject_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;
alter table public.audit_logs force row level security;
revoke all on public.audit_logs from anon, public;
grant select on public.audit_logs to authenticated;
create policy audit_admin_read on public.audit_logs for select to authenticated
  using (public.has_role(auth.uid(), 'admin') and (auth.jwt()->>'aal') = 'aal2');
create or replace function public.reject_audit_mutation()
returns trigger language plpgsql set search_path = public as $$ begin raise exception 'Audit log records are immutable'; end $$;
drop trigger if exists audit_logs_immutable on public.audit_logs;
create trigger audit_logs_immutable before update or delete on public.audit_logs for each row execute function public.reject_audit_mutation();
revoke execute on function public.reject_audit_mutation() from public, anon, authenticated;

-- Preserve old data in an inaccessible schema. Password-bearing app_accounts stays quarantined.
create schema if not exists legacy;
do $$ declare t text; begin
  foreach t in array array['app_accounts','registered_students_master','user_login_audit_logs','driver_id_passes','bus_pass_applications_master','bus_routes_master','bus_stops_master','pass_scan_logs'] loop
    if to_regclass('public.'||t) is not null and to_regclass('legacy.'||t) is null then
      execute format('alter table public.%I set schema legacy', t);
    end if;
  end loop;
  for t in select tablename from pg_tables where schemaname='public'
    and (tablename like 'pass_scan_logs_%' or tablename like 'driver_shift_logs_%') loop
    if to_regclass('legacy.'||t) is null then execute format('alter table public.%I set schema legacy', t); end if;
  end loop;
end $$;
revoke all on schema legacy from anon, authenticated, public;
revoke all on all tables in schema legacy from anon, authenticated, public;
do $$ begin
  if to_regclass('legacy.app_accounts') is not null then
    comment on table legacy.app_accounts is 'Export any records you need, then drop this table: it contains plaintext passwords. Passwords must not be migrated; invite users to set a new password.';
  end if;
end $$;

commit;
