-- Users profile table aligned with Supabase Auth
create table if not exists public.users (
  id uuid references auth.users primary key,
  created_at timestamp with time zone default now(),
  email text not null,
  full_name text,
  company text,
  role text,
  interests text[],
  avatar_url text,
  subscription_tier text default 'demo',
  projects_count integer default 0,
  last_login timestamp with time zone
);

-- Basic RLS
alter table public.users enable row level security;

-- Policies: owners can read/update their row; public can insert self on signup
create policy "Users can view their profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update their profile" on public.users
  for update using (auth.uid() = id);

create policy "Insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- Helpful index
create index if not exists users_email_idx on public.users(email);


