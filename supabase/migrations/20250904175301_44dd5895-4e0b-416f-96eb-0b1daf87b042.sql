-- Create user profiles table for persistent profile storage
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('student', 'job_seeker', 'general')),
  profile_name TEXT NOT NULL,
  photo_url TEXT,
  completion_percentage INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, profile_name)
);

-- Create profile data table for flexible field storage
CREATE TABLE public.profile_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_value TEXT,
  field_category TEXT,
  data_source TEXT DEFAULT 'manual' CHECK (data_source IN ('manual', 'document', 'form_submission')),
  confidence_score INTEGER DEFAULT 100 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  source_document_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, field_key)
);

-- Create profile documents table linking profiles to uploaded documents
CREATE TABLE public.profile_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.document_uploads(id) ON DELETE CASCADE,
  document_type TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, document_id)
);

-- Create form submission profiles table for tracking which profiles were used
CREATE TABLE public.form_submission_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL,
  form_url TEXT,
  profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  submission_data JSONB,
  should_save_profile BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submission_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profiles" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profiles" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profiles" 
ON public.user_profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for profile_data
CREATE POLICY "Users can view their own profile data" 
ON public.profile_data 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_profiles 
  WHERE id = profile_data.profile_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create their own profile data" 
ON public.profile_data 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_profiles 
  WHERE id = profile_data.profile_id AND user_id = auth.uid()
));

CREATE POLICY "Users can update their own profile data" 
ON public.profile_data 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.user_profiles 
  WHERE id = profile_data.profile_id AND user_id = auth.uid()
));

CREATE POLICY "Users can delete their own profile data" 
ON public.profile_data 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.user_profiles 
  WHERE id = profile_data.profile_id AND user_id = auth.uid()
));

-- RLS Policies for profile_documents
CREATE POLICY "Users can view their own profile documents" 
ON public.profile_documents 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_profiles 
  WHERE id = profile_documents.profile_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create their own profile documents" 
ON public.profile_documents 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_profiles 
  WHERE id = profile_documents.profile_id AND user_id = auth.uid()
));

CREATE POLICY "Users can update their own profile documents" 
ON public.profile_documents 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.user_profiles 
  WHERE id = profile_documents.profile_id AND user_id = auth.uid()
));

CREATE POLICY "Users can delete their own profile documents" 
ON public.profile_documents 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.user_profiles 
  WHERE id = profile_documents.profile_id AND user_id = auth.uid()
));

-- RLS Policies for form_submission_profiles
CREATE POLICY "Users can view their own form submissions" 
ON public.form_submission_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own form submissions" 
ON public.form_submission_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own form submissions" 
ON public.form_submission_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);

-- Create storage policies for profile photos
CREATE POLICY "Profile photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload their own profile photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profile_data_updated_at
BEFORE UPDATE ON public.profile_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();