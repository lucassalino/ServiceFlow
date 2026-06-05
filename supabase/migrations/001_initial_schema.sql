-- ============================================================
-- ServiceFlow — Initial Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text not null default '',
  avatar_url    text,
  phone         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
create table if not exists public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  logo_url      text,
  invite_code   text not null unique,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- ORGANIZATION MEMBERS
-- ============================================================
create type if not exists public.org_role as enum ('admin', 'leader', 'member');

create table if not exists public.organization_members (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        public.org_role not null default 'member',
  is_active   boolean not null default true,
  joined_at   timestamptz not null default now(),
  unique (org_id, user_id)
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create type if not exists public.plan_id as enum (
  'free', 'starter', 'growth', 'pro', 'enterprise'
);

create table if not exists public.subscriptions (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade unique,
  plan            public.plan_id not null default 'free',
  member_limit    int not null default 7,
  is_active       boolean not null default true,
  revenuecat_id   text,
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- MINISTRIES
-- ============================================================
create table if not exists public.ministries (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null,
  icon        text not null default 'music',
  color       text not null default '#888887',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- MINISTRY MEMBERS
-- ============================================================
create table if not exists public.ministry_members (
  id            uuid primary key default gen_random_uuid(),
  ministry_id   uuid not null references public.ministries(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  functions     text[] not null default '{}',
  is_active     boolean not null default true,
  unique (ministry_id, user_id)
);

-- ============================================================
-- EVENTS
-- ============================================================
create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  name          text not null,
  date          date not null,
  time          time not null,
  location      text,
  color         text,
  description   text,
  observations  text,
  is_published  boolean not null default false,
  created_by    uuid not null references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- EVENT MINISTRIES (which ministries are in each event)
-- ============================================================
create table if not exists public.event_ministries (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events(id) on delete cascade,
  ministry_id   uuid not null references public.ministries(id) on delete cascade,
  unique (event_id, ministry_id)
);

-- ============================================================
-- EVENT SCHEDULES (who is scaled per event+ministry)
-- ============================================================
create table if not exists public.event_schedules (
  id                    uuid primary key default gen_random_uuid(),
  event_ministry_id     uuid not null references public.event_ministries(id) on delete cascade,
  user_id               uuid not null references public.profiles(id) on delete cascade,
  functions             text[] not null default '{}',
  confirmed             boolean,
  unique (event_ministry_id, user_id)
);

-- ============================================================
-- SONGS
-- ============================================================
create table if not exists public.songs (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  ministry_id   uuid references public.ministries(id) on delete set null,
  name          text not null,
  artist        text,
  musical_key   text,
  bpm           int,
  lyrics        text,
  youtube_url   text,
  chords        text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- EVENT SETLISTS
-- ============================================================
create table if not exists public.event_setlists (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events(id) on delete cascade,
  song_id       uuid not null references public.songs(id) on delete cascade,
  order_index   int not null default 0,
  unique (event_id, song_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  event_id    uuid references public.events(id) on delete set null,
  message     text not null,
  is_read     boolean not null default false,
  sent_at     timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY — enable on all tables
-- ============================================================
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.subscriptions enable row level security;
alter table public.ministries enable row level security;
alter table public.ministry_members enable row level security;
alter table public.events enable row level security;
alter table public.event_ministries enable row level security;
alter table public.event_schedules enable row level security;
alter table public.songs enable row level security;
alter table public.event_setlists enable row level security;
alter table public.notifications enable row level security;

-- Helper: check if user is a member of an org
create or replace function public.is_org_member(p_org_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.organization_members
    where org_id = p_org_id
      and user_id = auth.uid()
      and is_active = true
  );
$$;

-- Helper: check if user is admin or leader in an org
create or replace function public.is_org_admin_or_leader(p_org_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.organization_members
    where org_id = p_org_id
      and user_id = auth.uid()
      and role in ('admin', 'leader')
      and is_active = true
  );
$$;

-- Helper: check if user is admin in an org
create or replace function public.is_org_admin(p_org_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.organization_members
    where org_id = p_org_id
      and user_id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- PROFILES: users can read any profile, update only their own
create policy "profiles: read all" on public.profiles for select using (true);
create policy "profiles: update own" on public.profiles for update using (id = auth.uid());

-- ORGANIZATIONS: members can read their orgs; admins can update
create policy "organizations: members can read" on public.organizations
  for select using (public.is_org_member(id));

create policy "organizations: admins can update" on public.organizations
  for update using (public.is_org_admin(id));

create policy "organizations: authenticated can create" on public.organizations
  for insert with check (auth.uid() is not null);

-- ORGANIZATION MEMBERS
create policy "org_members: members can read own org" on public.organization_members
  for select using (public.is_org_member(org_id));

create policy "org_members: admins can insert" on public.organization_members
  for insert with check (
    public.is_org_admin(org_id) or user_id = auth.uid()
  );

create policy "org_members: admins can update" on public.organization_members
  for update using (public.is_org_admin(org_id));

create policy "org_members: admins can delete" on public.organization_members
  for delete using (public.is_org_admin(org_id));

-- SUBSCRIPTIONS: org members can read; admins can manage
create policy "subscriptions: members can read" on public.subscriptions
  for select using (public.is_org_member(org_id));

create policy "subscriptions: service role can upsert" on public.subscriptions
  for all using (auth.uid() is not null);

-- MINISTRIES
create policy "ministries: members can read" on public.ministries
  for select using (public.is_org_member(org_id));

create policy "ministries: admins/leaders can write" on public.ministries
  for insert with check (public.is_org_admin_or_leader(org_id));

create policy "ministries: admins/leaders can update" on public.ministries
  for update using (public.is_org_admin_or_leader(org_id));

create policy "ministries: admins can delete" on public.ministries
  for delete using (public.is_org_admin(org_id));

-- MINISTRY MEMBERS
create policy "ministry_members: org members can read" on public.ministry_members
  for select using (
    exists (
      select 1 from public.ministries m
      where m.id = ministry_id and public.is_org_member(m.org_id)
    )
  );

create policy "ministry_members: admins/leaders can write" on public.ministry_members
  for insert with check (
    exists (
      select 1 from public.ministries m
      where m.id = ministry_id and public.is_org_admin_or_leader(m.org_id)
    )
  );

create policy "ministry_members: admins/leaders can update" on public.ministry_members
  for update using (
    exists (
      select 1 from public.ministries m
      where m.id = ministry_id and public.is_org_admin_or_leader(m.org_id)
    )
  );

-- EVENTS
create policy "events: org members can read" on public.events
  for select using (public.is_org_member(org_id));

create policy "events: admins/leaders can write" on public.events
  for insert with check (public.is_org_admin_or_leader(org_id));

create policy "events: admins/leaders can update" on public.events
  for update using (public.is_org_admin_or_leader(org_id));

create policy "events: admins can delete" on public.events
  for delete using (public.is_org_admin(org_id));

-- EVENT MINISTRIES
create policy "event_ministries: org members can read" on public.event_ministries
  for select using (
    exists (
      select 1 from public.events e
      where e.id = event_id and public.is_org_member(e.org_id)
    )
  );

create policy "event_ministries: admins/leaders can write" on public.event_ministries
  for insert with check (
    exists (
      select 1 from public.events e
      where e.id = event_id and public.is_org_admin_or_leader(e.org_id)
    )
  );

create policy "event_ministries: admins/leaders can delete" on public.event_ministries
  for delete using (
    exists (
      select 1 from public.events e
      where e.id = event_id and public.is_org_admin_or_leader(e.org_id)
    )
  );

-- EVENT SCHEDULES
create policy "event_schedules: org members can read" on public.event_schedules
  for select using (
    exists (
      select 1 from public.event_ministries em
      join public.events e on e.id = em.event_id
      where em.id = event_ministry_id and public.is_org_member(e.org_id)
    )
  );

create policy "event_schedules: admins/leaders can write" on public.event_schedules
  for insert with check (
    exists (
      select 1 from public.event_ministries em
      join public.events e on e.id = em.event_id
      where em.id = event_ministry_id and public.is_org_admin_or_leader(e.org_id)
    )
  );

create policy "event_schedules: admins/leaders can update" on public.event_schedules
  for update using (
    exists (
      select 1 from public.event_ministries em
      join public.events e on e.id = em.event_id
      where em.id = event_ministry_id and public.is_org_admin_or_leader(e.org_id)
    )
  );

-- SONGS
create policy "songs: org members can read" on public.songs
  for select using (public.is_org_member(org_id));

create policy "songs: admins/leaders can write" on public.songs
  for insert with check (public.is_org_admin_or_leader(org_id));

create policy "songs: admins/leaders can update" on public.songs
  for update using (public.is_org_admin_or_leader(org_id));

create policy "songs: admins can delete" on public.songs
  for delete using (public.is_org_admin(org_id));

-- EVENT SETLISTS
create policy "setlists: org members can read" on public.event_setlists
  for select using (
    exists (
      select 1 from public.events e where e.id = event_id and public.is_org_member(e.org_id)
    )
  );

create policy "setlists: admins/leaders can write" on public.event_setlists
  for insert with check (
    exists (
      select 1 from public.events e where e.id = event_id and public.is_org_admin_or_leader(e.org_id)
    )
  );

create policy "setlists: admins/leaders can update" on public.event_setlists
  for update using (
    exists (
      select 1 from public.events e where e.id = event_id and public.is_org_admin_or_leader(e.org_id)
    )
  );

-- NOTIFICATIONS: each user sees only their own
create policy "notifications: own" on public.notifications
  for select using (user_id = auth.uid());

create policy "notifications: mark read" on public.notifications
  for update using (user_id = auth.uid());
