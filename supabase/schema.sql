create extension if not exists pgcrypto;

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_sessions (
  token uuid primary key,
  admin_id uuid not null references public.admins(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  qr_token uuid unique not null default gen_random_uuid(),
  last_name text not null,
  first_name text not null,
  middle_name text not null,
  address text not null,
  date_of_birth date not null,
  sex text not null check (sex in ('Male', 'Female')),
  age integer not null check (age >= 0),
  contact_number text,
  avatar_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id bigserial primary key,
  member_id uuid not null references public.members(id) on delete cascade,
  service_date date not null,
  scanned_at timestamptz not null default now(),
  source text not null default 'online' check (source in ('online', 'offline-sync')),
  scanner_note text,
  created_by_admin uuid references public.admins(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(member_id, service_date)
);

create table if not exists public.sync_audit (
  id bigserial primary key,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_members_name on public.members(last_name, first_name);
create index if not exists idx_members_qr on public.members(qr_token);
create index if not exists idx_attendance_service_date on public.attendance(service_date);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_members_updated_at on public.members;
create trigger trg_members_updated_at
before update on public.members
for each row
execute function public.set_updated_at();

insert into public.admins (email, password_hash)
values ('admin@church.local', '$2b$10$V6i11VuBlookOWzv1S48Ke4tFgK5ZdSar02Xb7K05k7CNlnyvlheS')
on conflict (email) do nothing;
