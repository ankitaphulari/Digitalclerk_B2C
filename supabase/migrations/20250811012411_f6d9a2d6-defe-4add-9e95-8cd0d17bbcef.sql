-- Applications table to persist AI-extracted data and selected form URL
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  form_type text not null,
  form_url text,
  extracted_data jsonb,
  files jsonb,
  status text not null default 'draft',
  confidence int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.applications enable row level security;

-- Policies: users can only access their own rows
create policy if not exists "Users can view their own applications"
  on public.applications for select
  using (auth.uid() = user_id);

create policy if not exists "Users can insert their own applications"
  on public.applications for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can update their own applications"
  on public.applications for update
  using (auth.uid() = user_id);

create policy if not exists "Users can delete their own applications"
  on public.applications for delete
  using (auth.uid() = user_id);

-- Trigger to update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger applications_set_updated_at
before update on public.applications
for each row execute function public.set_updated_at();