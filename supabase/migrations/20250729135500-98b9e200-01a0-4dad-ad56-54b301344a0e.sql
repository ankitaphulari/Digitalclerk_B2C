-- Add extracted data column to documents table
ALTER TABLE public.documents 
ADD COLUMN extracted_data JSONB;

-- Add extraction status to track OCR processing
ALTER TABLE public.documents 
ADD COLUMN extraction_status TEXT DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed'));