import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'Super Admin' | 'Admin' | 'Sales Manager' | 'Technician' | 'Office Staff' | 'Read-Only User' | 'customer' | null;

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      console.log('🔍 useUserRole: Starting to fetch user role...');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('✅ useUserRole: Got user:', user?.id);
        
        if (!user) {
          console.log('❌ useUserRole: No user found');
          setRole(null);
          setLoading(false);
          return;
        }

        console.log('🔍 useUserRole: Fetching role from user_roles table...');
        const { data, error } = await supabase
          .from('user_roles')
          .select('role_id, roles(name)')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('📊 useUserRole: Query result:', { data, error });

        if (error) {
          console.error('❌ useUserRole: Error fetching role:', error);
          setRole('customer'); // Default to customer
          setLoading(false);
        } else if (data && data.roles) {
          console.log('✅ useUserRole: Found role:', data.roles.name);
          setRole(data.roles.name as UserRole);
          setLoading(false);
        } else {
          console.log('⚠️ useUserRole: No role found, defaulting to customer');
          setRole('customer');
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ useUserRole: Unexpected error:', err);
        setRole('customer');
        setLoading(false);
      }
    };

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn('⏱️ useUserRole: Timeout reached, forcing load complete');
      setLoading(false);
      setRole('customer');
    }, 5000); // 5 second timeout

    fetchUserRole().then(() => clearTimeout(timeout));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      console.log('🔄 useUserRole: Auth state changed, refetching role...');
      fetchUserRole();
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  return { role, loading };
};
