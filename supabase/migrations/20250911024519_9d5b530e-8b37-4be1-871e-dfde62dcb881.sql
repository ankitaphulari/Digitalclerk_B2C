-- Fix RLS policies to ensure proper authentication for all user-specific data
-- Remove anonymous access while preserving functionality

-- Update applications table policies to require authenticated users only
DROP POLICY IF EXISTS "Authenticated users can delete their own applications" ON public.applications;
DROP POLICY IF EXISTS "Authenticated users can update their own applications" ON public.applications;
DROP POLICY IF EXISTS "Authenticated users can view their own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can insert their own applications" ON public.applications;

CREATE POLICY "Authenticated users can insert their own applications" 
ON public.applications 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own applications" 
ON public.applications 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own applications" 
ON public.applications 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own applications" 
ON public.applications 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Update document_uploads table policies
DROP POLICY IF EXISTS "Authenticated users can delete their own document_uploads" ON public.document_uploads;
DROP POLICY IF EXISTS "Authenticated users can update their own document_uploads" ON public.document_uploads;
DROP POLICY IF EXISTS "Authenticated users can view their own document_uploads" ON public.document_uploads;
DROP POLICY IF EXISTS "Users can insert their own document_uploads" ON public.document_uploads;

CREATE POLICY "Authenticated users can insert their own document_uploads" 
ON public.document_uploads 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own document_uploads" 
ON public.document_uploads 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own document_uploads" 
ON public.document_uploads 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own document_uploads" 
ON public.document_uploads 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Update documents table policies
DROP POLICY IF EXISTS "Authenticated users can delete their own documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can upload their own documents" ON public.documents;

CREATE POLICY "Authenticated users can insert their own documents" 
ON public.documents 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own documents" 
ON public.documents 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own documents" 
ON public.documents 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own documents" 
ON public.documents 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Update form_submission_profiles policies
DROP POLICY IF EXISTS "Authenticated users can update their own form submissions" ON public.form_submission_profiles;
DROP POLICY IF EXISTS "Authenticated users can view their own form submissions" ON public.form_submission_profiles;
DROP POLICY IF EXISTS "Users can create their own form submissions" ON public.form_submission_profiles;

CREATE POLICY "Authenticated users can insert their own form submissions" 
ON public.form_submission_profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own form submissions" 
ON public.form_submission_profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own form submissions" 
ON public.form_submission_profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Update form_submissions policies
DROP POLICY IF EXISTS "Authenticated users can update their own submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Authenticated users can view their own submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Users can create their own submissions" ON public.form_submissions;

CREATE POLICY "Authenticated users can insert their own submissions" 
ON public.form_submissions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own submissions" 
ON public.form_submissions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own submissions" 
ON public.form_submissions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Keep forms table accessible to anonymous users as it's public form definitions
-- But update the policy to be more specific
DROP POLICY IF EXISTS "Anyone can view active forms" ON public.forms;

CREATE POLICY "Public forms are viewable by everyone" 
ON public.forms 
FOR SELECT 
USING (is_active = true);

-- Update profile tables to require authentication
DROP POLICY IF EXISTS "Authenticated users can delete their own profile data" ON public.profile_data;
DROP POLICY IF EXISTS "Authenticated users can update their own profile data" ON public.profile_data;
DROP POLICY IF EXISTS "Authenticated users can view their own profile data" ON public.profile_data;
DROP POLICY IF EXISTS "Users can create their own profile data" ON public.profile_data;

CREATE POLICY "Authenticated users can insert their own profile data" 
ON public.profile_data 
FOR INSERT 
TO authenticated
WITH CHECK (EXISTS ( SELECT 1 FROM user_profiles WHERE id = profile_data.profile_id AND user_id = auth.uid()));

CREATE POLICY "Authenticated users can view their own profile data" 
ON public.profile_data 
FOR SELECT 
TO authenticated
USING (EXISTS ( SELECT 1 FROM user_profiles WHERE id = profile_data.profile_id AND user_id = auth.uid()));

CREATE POLICY "Authenticated users can update their own profile data" 
ON public.profile_data 
FOR UPDATE 
TO authenticated
USING (EXISTS ( SELECT 1 FROM user_profiles WHERE id = profile_data.profile_id AND user_id = auth.uid()));

CREATE POLICY "Authenticated users can delete their own profile data" 
ON public.profile_data 
FOR DELETE 
TO authenticated
USING (EXISTS ( SELECT 1 FROM user_profiles WHERE id = profile_data.profile_id AND user_id = auth.uid()));

-- Add delete policy for form_submission_profiles
CREATE POLICY "Authenticated users can delete their own form submissions" 
ON public.form_submission_profiles 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Add delete policy for form_submissions  
CREATE POLICY "Authenticated users can delete their own submissions" 
ON public.form_submissions 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);