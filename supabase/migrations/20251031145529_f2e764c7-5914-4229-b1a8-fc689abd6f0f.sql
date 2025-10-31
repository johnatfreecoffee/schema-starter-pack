-- Add stage_order column to ai_model_configs table
ALTER TABLE public.ai_model_configs
ADD COLUMN stage_order integer;

-- Update existing rows with the correct stage order
UPDATE public.ai_model_configs
SET stage_order = CASE 
  WHEN stage = 'planning' THEN 1
  WHEN stage = 'content' THEN 2
  WHEN stage = 'html' THEN 3
  WHEN stage = 'styling' THEN 4
  ELSE 0
END;

-- Make stage_order NOT NULL after populating values
ALTER TABLE public.ai_model_configs
ALTER COLUMN stage_order SET NOT NULL;

-- Add a check constraint to ensure stage_order is valid
ALTER TABLE public.ai_model_configs
ADD CONSTRAINT stage_order_valid CHECK (stage_order BETWEEN 1 AND 4);

-- Add comment for documentation
COMMENT ON COLUMN public.ai_model_configs.stage_order IS 'Order of execution for pipeline stages: 1=Planning, 2=Content, 3=HTML, 4=Styling';