alter table public.admins enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.members enable row level security;
alter table public.attendance enable row level security;
alter table public.sync_audit enable row level security;

-- APIs use service role. Keep restrictive policies for anon/authenticated by default.
drop policy if exists deny_all_admins on public.admins;
create policy deny_all_admins on public.admins for all to anon, authenticated using (false) with check (false);

drop policy if exists deny_all_admin_sessions on public.admin_sessions;
create policy deny_all_admin_sessions on public.admin_sessions for all to anon, authenticated using (false) with check (false);

drop policy if exists deny_all_members on public.members;
create policy deny_all_members on public.members for all to anon, authenticated using (false) with check (false);

drop policy if exists deny_all_attendance on public.attendance;
create policy deny_all_attendance on public.attendance for all to anon, authenticated using (false) with check (false);

drop policy if exists deny_all_sync_audit on public.sync_audit;
create policy deny_all_sync_audit on public.sync_audit for all to anon, authenticated using (false) with check (false);

insert into storage.buckets (id, name, public)
values ('member-avatars', 'member-avatars', true)
on conflict (id) do nothing;

-- Service role bypasses policies. Keep public read if desired for card rendering.
drop policy if exists avatar_public_read on storage.objects;
create policy avatar_public_read
on storage.objects for select
to anon, authenticated
using (bucket_id = 'member-avatars');
