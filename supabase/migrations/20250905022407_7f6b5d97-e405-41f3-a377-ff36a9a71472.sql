-- Fix RLS policies to require authentication
UPDATE pg_policies 
SET roles = '{authenticated}' 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'profile_data', 'profile_documents', 'form_submission_profiles')
  AND roles = '{anon,authenticated}';