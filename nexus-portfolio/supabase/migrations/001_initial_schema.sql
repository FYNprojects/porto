-- NEXUS portfolio schema. Run this file in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users au where au.user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null default 'Your Name',
  headline text not null default 'Electrical Engineering Student',
  tagline text,
  biography text,
  profile_image text,
  university text,
  major text,
  location text,
  email text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null default 'Other Projects',
  short_description text,
  overview text,
  background text,
  problem_statement text,
  my_role text,
  development_process text,
  results text,
  cover_image text,
  github_url text,
  demo_url text,
  featured boolean not null default false,
  is_published boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  image_url text not null,
  alt_text text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.project_technologies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  technology_name text not null,
  created_at timestamptz not null default now(),
  unique(project_id, technology_name)
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'General',
  description text,
  icon text,
  display_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skill_projects (
  skill_id uuid not null references public.skills(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  primary key (skill_id, project_id)
);

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  organization text not null,
  position text not null,
  category text,
  description text,
  responsibilities text[] not null default '{}',
  start_date date,
  end_date date,
  is_current boolean not null default false,
  documentation_url text,
  is_published boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  issuer text,
  category text,
  description text,
  achievement_date date,
  certificate_url text,
  is_published boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text not null,
  display_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value text,
  is_public boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null check (bucket in ('portfolio-images','portfolio-certificates')),
  file_path text not null,
  public_url text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now(),
  unique(bucket, file_path)
);

create index if not exists projects_public_order_idx on public.projects(is_published, display_order);
create index if not exists skills_public_order_idx on public.skills(is_published, display_order);
create index if not exists experiences_public_date_idx on public.experiences(is_published, start_date desc);
create index if not exists achievements_public_date_idx on public.achievements(is_published, achievement_date desc);

-- Keep updated_at current on edited rows.
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','projects','skills','experiences','achievements','social_links','site_settings'] loop
    execute format('drop trigger if exists %I on public.%I', 'set_' || t || '_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', 'set_' || t || '_updated_at', t);
  end loop;
end $$;

-- Grant Data API table privileges; RLS below defines which rows each role can actually access.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;

-- Enable RLS on all API-facing tables.
alter table public.admin_users enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.project_technologies enable row level security;
alter table public.skills enable row level security;
alter table public.skill_projects enable row level security;
alter table public.experiences enable row level security;
alter table public.achievements enable row level security;
alter table public.social_links enable row level security;
alter table public.site_settings enable row level security;
alter table public.media_assets enable row level security;

-- admin_users: an authenticated user can read only their own admin membership.
drop policy if exists "admin can read own membership" on public.admin_users;
create policy "admin can read own membership" on public.admin_users for select to authenticated using (user_id = (select auth.uid()));

-- Public read for published profile and content; full writes for admins.
drop policy if exists "public reads published profiles" on public.profiles;
create policy "public reads published profiles" on public.profiles for select to anon, authenticated using (is_published = true or (select public.is_admin()));
drop policy if exists "admins manage profiles" on public.profiles;
create policy "admins manage profiles" on public.profiles for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

do $$
declare t text;
begin
  foreach t in array array['projects','skills','experiences','achievements','social_links'] loop
    execute format('drop policy if exists "public reads published %1$s" on public.%1$I', t);
    execute format('create policy "public reads published %1$s" on public.%1$I for select to anon, authenticated using (is_published = true or (select public.is_admin()))', t);
    execute format('drop policy if exists "admins manage %1$s" on public.%1$I', t);
    execute format('create policy "admins manage %1$s" on public.%1$I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
  end loop;
end $$;

-- Child records only become public when their parent project is published.
drop policy if exists "public reads images of published projects" on public.project_images;
create policy "public reads images of published projects" on public.project_images for select to anon, authenticated using (
  exists (select 1 from public.projects p where p.id = project_id and (p.is_published = true or (select public.is_admin())))
);
drop policy if exists "admins manage project images" on public.project_images;
create policy "admins manage project images" on public.project_images for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "public reads technologies of published projects" on public.project_technologies;
create policy "public reads technologies of published projects" on public.project_technologies for select to anon, authenticated using (
  exists (select 1 from public.projects p where p.id = project_id and (p.is_published = true or (select public.is_admin())))
);
drop policy if exists "admins manage project technologies" on public.project_technologies;
create policy "admins manage project technologies" on public.project_technologies for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "public reads skill project links" on public.skill_projects;
create policy "public reads skill project links" on public.skill_projects for select to anon, authenticated using (
  exists (select 1 from public.skills s where s.id = skill_id and s.is_published = true)
  and exists (select 1 from public.projects p where p.id = project_id and p.is_published = true)
);
drop policy if exists "admins manage skill project links" on public.skill_projects;
create policy "admins manage skill project links" on public.skill_projects for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "public reads public site settings" on public.site_settings;
create policy "public reads public site settings" on public.site_settings for select to anon, authenticated using (is_public = true or (select public.is_admin()));
drop policy if exists "admins manage site settings" on public.site_settings;
create policy "admins manage site settings" on public.site_settings for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "admins manage media metadata" on public.media_assets;
create policy "admins manage media metadata" on public.media_assets for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Storage buckets. Files intended for public portfolio display are public-readable.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('portfolio-images','portfolio-images',true,8388608,array['image/jpeg','image/png','image/webp','image/gif']),
  ('portfolio-certificates','portfolio-certificates',true,8388608,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public can view portfolio media" on storage.objects;
create policy "public can view portfolio media" on storage.objects for select to anon, authenticated using (bucket_id in ('portfolio-images','portfolio-certificates'));
drop policy if exists "admins upload portfolio media" on storage.objects;
create policy "admins upload portfolio media" on storage.objects for insert to authenticated with check (bucket_id in ('portfolio-images','portfolio-certificates') and (select public.is_admin()));
drop policy if exists "admins update portfolio media" on storage.objects;
create policy "admins update portfolio media" on storage.objects for update to authenticated using (bucket_id in ('portfolio-images','portfolio-certificates') and (select public.is_admin())) with check (bucket_id in ('portfolio-images','portfolio-certificates') and (select public.is_admin()));
drop policy if exists "admins delete portfolio media" on storage.objects;
create policy "admins delete portfolio media" on storage.objects for delete to authenticated using (bucket_id in ('portfolio-images','portfolio-certificates') and (select public.is_admin()));

-- Optional starter profile. Edit it from Admin Dashboard after setup.
insert into public.profiles (full_name, headline, tagline, is_published)
select 'Your Name', 'Electrical Engineering Student', 'A space where ideas become reality.', false
where not exists (select 1 from public.profiles);
