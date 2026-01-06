-- Profiles table for user role management
-- Role-based access: 0=anon, 1=basic, 2=freelancer, 3=premium
create table if not exists public.profiles (
  id uuid references auth.users primary key on delete cascade,
  email text not null,
  full_name text,
  company text,
  role integer default 1 check (role in (0, 1, 2, 3)), -- 0=anon, 1=basic, 2=freelancer, 3=premium
  ai_requests_today integer default 0,
  ai_requests_limit integer default 10,
  subscription_expires timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes for profiles
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_profiles_email on profiles(email);

-- Row Level Security
alter table public.profiles enable row level security;

-- Policies: users can view and manage their own profile
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for updated_at
create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();


