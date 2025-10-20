import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'Super Admin' | 'Admin' | 'Sales Manager' | 'Technician' | 'Office Staff' | 'Read-Only User' | 'customer' | null;

// In-memory cache to prevent repeated RPC calls
const roleCache = new Map<string, { role: UserRole; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

// Global auth subscription management
let globalAuthSubscribed = false;
let globalListeners: Array<() => void> = [];

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole(null);
          setLoading(false);
          return;
        }

        // Check cache first
        const cached = roleCache.get(user.id);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setRole(cached.role);
          setLoading(false);
          return;
        }

        // Use RPC instead of direct table query - NO RECURSION POSSIBLE
        const { data, error } = await supabase.rpc('rpc_get_current_user_role' as any) as { data: string | null; error: any };
        
        if (error) {
          console.error('Role fetch error:', error);
          setRole('customer');
        } else {
          const userRole = (data as string) || 'customer';
          setRole(userRole as UserRole);
          
          // Update cache
          roleCache.set(user.id, { 
            role: userRole as UserRole, 
            timestamp: Date.now() 
          });
        }
      } catch (err) {
        console.error('Unexpected error fetching role:', err);
        setRole('customer');
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    const notifyRefetch = () => {
      setTimeout(() => {
        void fetchUserRole();
      }, 0);
    };

    // Register listener
    globalListeners.push(notifyRefetch);

    // Single global auth subscription
    if (!globalAuthSubscribed) {
      globalAuthSubscribed = true;
      supabase.auth.onAuthStateChange(() => {
        globalListeners.forEach((fn) => fn());
      });
    }

    // Initial fetch
    void fetchUserRole();

    return () => {
      globalListeners = globalListeners.filter((fn) => fn !== notifyRefetch);
    };
  }, []);

  return { role, loading };
};
