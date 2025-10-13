-- Fix all RLS policies to require authentication only
-- This addresses the security vulnerability where anonymous users have access

-- Update function search path security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Remove anonymous access from all user-specific tables
DROP POLICY IF EXISTS "Users can view their own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can delete their own applications" ON public.applications;

CREATE POLICY "Authenticated users can view their own applications" 
ON public.applications FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own applications" 
ON public.applications FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own applications" 
ON public.applications FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Update document_uploads policies
DROP POLICY IF EXISTS "Users can view their own document_uploads" ON public.document_uploads;
DROP POLICY IF EXISTS "Users can update their own document_uploads" ON public.document_uploads;
DROP POLICY IF EXISTS "Users can delete their own document_uploads" ON public.document_uploads;

CREATE POLICY "Authenticated users can view their own document_uploads" 
ON public.document_uploads FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own document_uploads" 
ON public.document_uploads FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own document_uploads" 
ON public.document_uploads FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Update documents policies
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;

CREATE POLICY "Authenticated users can view their own documents" 
ON public.documents FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own documents" 
ON public.documents FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own documents" 
ON public.documents FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Update form_submission_profiles policies
DROP POLICY IF EXISTS "Users can view their own form submissions" ON public.form_submission_profiles;
DROP POLICY IF EXISTS "Users can update their own form submissions" ON public.form_submission_profiles;

CREATE POLICY "Authenticated users can view their own form submissions" 
ON public.form_submission_profiles FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own form submissions" 
ON public.form_submission_profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Update form_submissions policies
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Users can update their own submissions" ON public.form_submissions;

CREATE POLICY "Authenticated users can view their own submissions" 
ON public.form_submissions FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own submissions" 
ON public.form_submissions FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Update profile_data policies
DROP POLICY IF EXISTS "Users can view their own profile data" ON public.profile_data;
DROP POLICY IF EXISTS "Users can update their own profile data" ON public.profile_data;
DROP POLICY IF EXISTS "Users can delete their own profile data" ON public.profile_data;

CREATE POLICY "Authenticated users can view their own profile data" 
ON public.profile_data FOR SELECT 
TO authenticated
USING (EXISTS ( SELECT 1 FROM user_profiles WHERE user_profiles.id = profile_data.profile_id AND user_profiles.user_id = auth.uid()));

CREATE POLICY "Authenticated users can update their own profile data" 
ON public.profile_data FOR UPDATE 
TO authenticated
USING (EXISTS ( SELECT 1 FROM user_profiles WHERE user_profiles.id = profile_data.profile_id AND user_profiles.user_id = auth.uid()));

CREATE POLICY "Authenticated users can delete their own profile data" 
ON public.profile_data FOR DELETE 
TO authenticated
USING (EXISTS ( SELECT 1 FROM user_profiles WHERE user_profiles.id = profile_data.profile_id AND user_profiles.user_id = auth.uid()));

-- Update profile_documents policies
DROP POLICY IF EXISTS "Users can view their own profile documents" ON public.profile_documents;
DROP POLICY IF EXISTS "Users can update their own profile documents" ON public.profile_documents;
DROP POLICY IF EXISTS "Users can delete their own profile documents" ON public.profile_documents;

CREATE POLICY "Authenticated users can view their own profile documents" 
ON public.profile_documents FOR SELECT 
TO authenticated
USING (EXISTS ( SELECT 1 FROM user_profiles WHERE user_profiles.id = profile_documents.profile_id AND user_profiles.user_id = auth.uid()));

CREATE POLICY "Authenticated users can update their own profile documents" 
ON public.profile_documents FOR UPDATE 
TO authenticated
USING (EXISTS ( SELECT 1 FROM user_profiles WHERE user_profiles.id = profile_documents.profile_id AND user_profiles.user_id = auth.uid()));

CREATE POLICY "Authenticated users can delete their own profile documents" 
ON public.profile_documents FOR DELETE 
TO authenticated
USING (EXISTS ( SELECT 1 FROM user_profiles WHERE user_profiles.id = profile_documents.profile_id AND user_profiles.user_id = auth.uid()));

-- Update profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view their own profile" 
ON public.profiles FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Update user_profiles policies
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profiles" ON public.user_profiles;

CREATE POLICY "Authenticated users can view their own profiles" 
ON public.user_profiles FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own profiles" 
ON public.user_profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own profiles" 
ON public.user_profiles FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);