-- Add Row Level Security policies for workflow automation tables

-- Enable RLS on all workflow tables
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

-- Workflows table policies
CREATE POLICY "Admins can view all workflows"
ON public.workflows
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can create workflows"
ON public.workflows
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can update workflows"
ON public.workflows
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can delete workflows"
ON public.workflows
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

-- Workflow actions table policies
CREATE POLICY "Admins can view all workflow actions"
ON public.workflow_actions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can create workflow actions"
ON public.workflow_actions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can update workflow actions"
ON public.workflow_actions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can delete workflow actions"
ON public.workflow_actions
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

-- Workflow executions table policies
CREATE POLICY "Admins can view all workflow executions"
ON public.workflow_executions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "System can create workflow executions"
ON public.workflow_executions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "System can update workflow executions"
ON public.workflow_executions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can delete workflow executions"
ON public.workflow_executions
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));