-- Adjust existing applications table to support AI flow
alter table public.applications add column if not exists form_url text;
alter table public.applications add column if not exists extracted_data jsonb;
alter table public.applications add column if not exists files jsonb;
alter table public.applications add column if not exists confidence int;

-- Ensure status has a default of 'draft' if not already set
alter table public.applications alter column status set default 'draft';