-- Robust, idempotent migration for public.applications with RLS and triggers
create extension if not exists pgcrypto;

-- Ensure timestamp trigger function exists
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'applications'
  ) THEN
    CREATE TABLE public.applications (
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
  END IF;
END $$;

-- Add missing columns safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='applications' AND column_name='user_id'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN user_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='applications' AND column_name='form_id'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN form_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='applications' AND column_name='form_name'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN form_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='applications' AND column_name='status'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN status text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='applications' AND column_name='progress'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN progress int;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='applications' AND column_name='data'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN data jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='applications' AND column_name='created_at'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN created_at timestamptz default now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='applications' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN updated_at timestamptz default now();
  END IF;

  -- Set NOT NULL and defaults where appropriate
  ALTER TABLE public.applications
    ALTER COLUMN status SET DEFAULT 'draft',
    ALTER COLUMN progress SET DEFAULT 0,
    ALTER COLUMN data SET DEFAULT '{}'::jsonb;

  -- Make sure required columns are NOT NULL if they exist
  BEGIN
    ALTER TABLE public.applications ALTER COLUMN user_id SET NOT NULL;
  EXCEPTION WHEN others THEN NULL; END;
  BEGIN
    ALTER TABLE public.applications ALTER COLUMN form_id SET NOT NULL;
  EXCEPTION WHEN others THEN NULL; END;
  BEGIN
    ALTER TABLE public.applications ALTER COLUMN status SET NOT NULL;
  EXCEPTION WHEN others THEN NULL; END;
  BEGIN
    ALTER TABLE public.applications ALTER COLUMN progress SET NOT NULL;
  EXCEPTION WHEN others THEN NULL; END;
END $$;

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Policies (only if missing)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='applications' AND policyname='Users can view their own applications'
  ) THEN
    CREATE POLICY "Users can view their own applications" ON public.applications
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='applications' AND policyname='Users can insert their own applications'
  ) THEN
    CREATE POLICY "Users can insert their own applications" ON public.applications
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='applications' AND policyname='Users can update their own applications'
  ) THEN
    CREATE POLICY "Users can update their own applications" ON public.applications
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='applications' AND policyname='Users can delete their own applications'
  ) THEN
    CREATE POLICY "Users can delete their own applications" ON public.applications
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger for updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_applications_updated_at'
  ) THEN
    CREATE TRIGGER set_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Indexes only if columns exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='applications' AND column_name='user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_applications_user ON public.applications(user_id);
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='applications' AND column_name='form_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_applications_form ON public.applications(form_id);
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='applications' AND column_name='status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
  END IF;
END $$;