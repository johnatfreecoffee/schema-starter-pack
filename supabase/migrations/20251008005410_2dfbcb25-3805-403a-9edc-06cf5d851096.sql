-- Add missing columns to projects table if they don't exist
DO $$ 
BEGIN
  -- Add description column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'description') THEN
    ALTER TABLE projects ADD COLUMN description TEXT;
  END IF;
  
  -- Add budget column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'budget') THEN
    ALTER TABLE projects ADD COLUMN budget DECIMAL(12,2);
  END IF;
  
  -- Add spent column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'spent') THEN
    ALTER TABLE projects ADD COLUMN spent DECIMAL(12,2) DEFAULT 0;
  END IF;
  
  -- Add project_manager column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'project_manager') THEN
    ALTER TABLE projects ADD COLUMN project_manager UUID REFERENCES auth.users(id);
  END IF;
  
  -- Add actual_completion column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'actual_completion') THEN
    ALTER TABLE projects ADD COLUMN actual_completion DATE;
  END IF;
  
  -- Add created_by column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'created_by') THEN
    ALTER TABLE projects ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Create project_phases table
CREATE TABLE IF NOT EXISTS project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  phase_name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  phase_order INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_account ON projects(account_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(project_manager);
CREATE INDEX IF NOT EXISTS idx_project_phases_project ON project_phases(project_id);

-- Add RLS policies for projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CRM users can view all projects" ON projects;
CREATE POLICY "CRM users can view all projects" 
ON projects FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'crm_user')
  )
);

DROP POLICY IF EXISTS "CRM users can create projects" ON projects;
CREATE POLICY "CRM users can create projects" 
ON projects FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'crm_user')
  )
);

DROP POLICY IF EXISTS "CRM users can update projects" ON projects;
CREATE POLICY "CRM users can update projects" 
ON projects FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'crm_user')
  )
);

DROP POLICY IF EXISTS "CRM users can delete projects" ON projects;
CREATE POLICY "CRM users can delete projects" 
ON projects FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'crm_user')
  )
);

-- Add RLS policies for project_phases
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CRM users can view all project phases" ON project_phases;
CREATE POLICY "CRM users can view all project phases" 
ON project_phases FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'crm_user')
  )
);

DROP POLICY IF EXISTS "CRM users can manage project phases" ON project_phases;
CREATE POLICY "CRM users can manage project phases" 
ON project_phases FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'crm_user')
  )
);

-- Add trigger for updated_at on project_phases
CREATE TRIGGER update_project_phases_updated_at
  BEFORE UPDATE ON project_phases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();