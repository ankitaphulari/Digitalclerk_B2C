-- Create a table for applications to store extracted/filled form data
create extension if not exists pgcrypto;

-- Timestamp update function (idempotent)
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Applications table
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  form_id text not null,
  form_name text,
  status text not null default 'draft',
  progress int not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.applications enable row level security;

-- Policies (idempotent safe create by dropping existing names if needed)
-- View own
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'applications' and policyname = 'Users can view their own applications'
  ) then
    create policy "Users can view their own applications"
    on public.applications
    for select
    using (auth.uid() = user_id);
  end if;
end $$;

-- Insert own
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'applications' and policyname = 'Users can insert their own applications'
  ) then
    create policy "Users can insert their own applications"
    on public.applications
    for insert
    with check (auth.uid() = user_id);
  end if;
end $$;

-- Update own
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'applications' and policyname = 'Users can update their own applications'
  ) then
    create policy "Users can update their own applications"
    on public.applications
    for update
    using (auth.uid() = user_id);
  end if;
end $$;

-- Delete own
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'applications' and policyname = 'Users can delete their own applications'
  ) then
    create policy "Users can delete their own applications"
    on public.applications
    for delete
    using (auth.uid() = user_id);
  end if;
end $$;

-- Trigger to keep updated_at fresh
create or replace trigger set_applications_updated_at
before update on public.applications
for each row execute function public.update_updated_at_column();

-- Helpful indexes
create index if not exists idx_applications_user on public.applications(user_id);
create index if not exists idx_applications_form on public.applications(form_id);
create index if not exists idx_applications_status on public.applications(status);
