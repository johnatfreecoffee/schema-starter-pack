
-- Fix the role assignment for crm.admin@test.com user
-- Change from 'customer' role to 'Admin' role

UPDATE user_roles 
SET role_id = 'b8a1dc57-8f03-4304-8238-ffcb7da4456f'
WHERE user_id = '78a85ac7-01b6-4576-b570-20869856413e'
  AND role_id = '981b2276-33c1-4447-88b9-53e0e55b09b1';

-- Add a comment for future reference
COMMENT ON TABLE user_roles IS 'Junction table linking users to their assigned roles. Use Admin role ID for admin users, customer role ID for portal users.';
