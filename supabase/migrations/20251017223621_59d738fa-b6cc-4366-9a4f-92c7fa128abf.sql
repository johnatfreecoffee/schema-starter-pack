-- Add RLS policies for tables with missing policies
-- This migration secures 11 tables that had RLS enabled but no policies

-- ========================================
-- HIGH PRIORITY: Protect PII and Business Data
-- ========================================

-- 1. LEADS TABLE (Contains customer PII - emails, phone numbers, addresses)
CREATE POLICY "Admins and CRM can view leads"
ON leads FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'crm_user'::user_role));

CREATE POLICY "Admins and CRM can insert leads"
ON leads FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'crm_user'::user_role));

CREATE POLICY "Admins and CRM can update leads"
ON leads FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'crm_user'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'crm_user'::user_role));

CREATE POLICY "Admins can delete leads"
ON leads FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

-- 2. EMAIL_QUEUE TABLE (Contains email addresses and message content)
CREATE POLICY "Admins and CRM can view email queue"
ON email_queue FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'crm_user'::user_role));

CREATE POLICY "System can insert emails"
ON email_queue FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can update email queue"
ON email_queue FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- ========================================
-- MEDIUM PRIORITY: Internal Operations
-- ========================================

-- 3. ANALYTICS_CACHE TABLE
CREATE POLICY "Admins and CRM can view analytics cache"
ON analytics_cache FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'crm_user'::user_role));

CREATE POLICY "System can manage analytics cache"
ON analytics_cache FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- 4. ANALYTICS_SNAPSHOTS TABLE
CREATE POLICY "Admins and CRM can view analytics snapshots"
ON analytics_snapshots FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'crm_user'::user_role));

CREATE POLICY "System can manage analytics snapshots"
ON analytics_snapshots FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- 5. IMPORT_HISTORY TABLE (Audit trail)
CREATE POLICY "Admins can view import history"
ON import_history FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins and CRM can insert import history"
ON import_history FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'crm_user'::user_role));

-- 6. PAGE_EDIT_HISTORY TABLE (Content audit trail)
CREATE POLICY "Admins can view page edit history"
ON page_edit_history FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "System can insert page edit history"
ON page_edit_history FOR INSERT
TO authenticated
WITH CHECK (true);

-- ========================================
-- LOWER PRIORITY: System Configuration
-- ========================================

-- 7. EVENT_PARTICIPANTS TABLE
CREATE POLICY "Users can view events they participate in"
ON event_participants FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  has_role(auth.uid(), 'admin'::user_role) OR 
  has_role(auth.uid(), 'crm_user'::user_role)
);

CREATE POLICY "Admins and CRM can manage participants"
ON event_participants FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'crm_user'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'crm_user'::user_role));

-- 8. LEAD_SUBMISSION_RATE_LIMIT TABLE (System-only anti-abuse)
CREATE POLICY "System can manage rate limits"
ON lead_submission_rate_limit FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- 9. PERMISSIONS TABLE (Permission definitions)
CREATE POLICY "Authenticated users can view permissions"
ON permissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage permissions"
ON permissions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- 10. PROJECT_PHASES TABLE
CREATE POLICY "Admins and CRM can view project phases"
ON project_phases FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'crm_user'::user_role));

CREATE POLICY "Admins and CRM can manage project phases"
ON project_phases FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'crm_user'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'crm_user'::user_role));