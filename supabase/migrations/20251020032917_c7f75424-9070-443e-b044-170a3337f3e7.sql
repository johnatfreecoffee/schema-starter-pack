-- Add Missing RLS Policies for tasks, templates, and users tables

-- Tasks table policies
CREATE POLICY "Admins and CRM can view tasks"
  ON public.tasks FOR SELECT
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'crm_user'::user_role));

CREATE POLICY "Admins and CRM can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'crm_user'::user_role));

CREATE POLICY "Admins and CRM can update tasks"
  ON public.tasks FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'crm_user'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'crm_user'::user_role));

CREATE POLICY "Admins can delete tasks"
  ON public.tasks FOR DELETE
  USING (has_role(auth.uid(), 'admin'::user_role));

-- Templates table policies
CREATE POLICY "Admins can manage templates"
  ON public.templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Anyone can view templates"
  ON public.templates FOR SELECT
  USING (true);

-- Users table policies (admin only access to view user list)
CREATE POLICY "Admins can view users"
  ON public.users FOR SELECT
  USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Users can view their own record"
  ON public.users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins can update users"
  ON public.users FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));