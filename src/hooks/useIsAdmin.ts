import { useUserRole } from './useUserRole';

export const useIsAdmin = () => {
  const { role, loading } = useUserRole();
  
  const isAdmin = role === 'Super Admin' || role === 'Admin';
  const isSuperAdmin = role === 'Super Admin';
  
  return { isAdmin, isSuperAdmin, loading };
};
