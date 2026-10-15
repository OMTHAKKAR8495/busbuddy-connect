-- Run with `supabase test db` after applying migrations. All fixture identities are synthetic.
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users(id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values
 ('10000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','student-a@gsfcuniversity.ac.in','x',now(),'{"role":"admin","full_name":"Student A"}',now(),now()),
 ('10000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','student-b@gsfcuniversity.ac.in','x',now(),'{"role":"admin","full_name":"Student B"}',now(),now()),
 ('10000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','driver@gsfcuniversity.ac.in','x',now(),'{"role":"admin"}',now(),now()),
 ('10000000-0000-4000-8000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','scanner@gsfcuniversity.ac.in','x',now(),'{"role":"admin"}',now(),now()),
 ('10000000-0000-4000-8000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','admin@gsfcuniversity.ac.in','x',now(),'{"role":"admin"}',now(),now())
on conflict (id) do nothing;

insert into public.user_roles(user_id, role) values
 ('10000000-0000-4000-8000-000000000003','driver'),
 ('10000000-0000-4000-8000-000000000004','scanner'),
 ('10000000-0000-4000-8000-000000000005','admin') on conflict do nothing;
insert into public.routes(id, route_number, name) values ('20000000-0000-4000-8000-000000000001','TEST','RLS test route') on conflict do nothing;
insert into public.buses(id,bus_number,plate,route_id,driver_id) values
 ('30000000-0000-4000-8000-000000000001','T1','TEST-1','20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003'),
 ('30000000-0000-4000-8000-000000000002','T2','TEST-2','20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002') on conflict do nothing;
insert into public.bus_passes(id,student_id,route_id,status,fee_paid) values
 ('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','active',true) on conflict do nothing;
insert into public.driver_profiles(user_id,licence_number,employee_id) values
 ('10000000-0000-4000-8000-000000000003','TEST-LIC-123','TEST-DRV') on conflict do nothing;
insert into public.audit_logs(actor_id,action) values ('10000000-0000-4000-8000-000000000005','rls_test');
insert into public.used_qr_tokens(jti,expires_at) values (repeat('a',32),now() + interval '30 seconds');
select throws_ok($$insert into public.used_qr_tokens(jti,expires_at) values (repeat('a',32),now() + interval '30 seconds')$$,'23505',null,'a QR jti can only be consumed once');

select is((select role::text from public.user_roles where user_id='10000000-0000-4000-8000-000000000001'),'student','signup metadata cannot assign a role');

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}',true);
select is((select count(*)::int from public.bus_passes),0,'student cannot read another student pass');
select is((select count(*)::int from public.profiles where id='10000000-0000-4000-8000-000000000001'),0,'student cannot read another profile');
select throws_ok($$insert into public.user_roles(user_id,role) values ('10000000-0000-4000-8000-000000000002','admin')$$,'42501',null,'authenticated cannot write roles');

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal1"}',true);
select throws_ok($$insert into public.bus_locations(bus_id,lat,lng) values ('30000000-0000-4000-8000-000000000002',22.3,73.2)$$,'42501',null,'driver cannot insert location for another bus');

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000004","role":"authenticated","aal":"aal1"}',true);
select is((select count(*)::int from public.driver_profiles),0,'scanner cannot read driver profiles');

set local role anon;
select throws_ok('select * from public.bus_passes','42501',null,'anon cannot read sensitive passes');
reset role;
select throws_ok($$update public.audit_logs set action='changed' where action='rls_test'$$,'42501',null,'audit rows cannot be updated');
select throws_ok($$delete from public.audit_logs where action='rls_test'$$,'42501',null,'audit rows cannot be deleted');
select * from finish();
rollback;
