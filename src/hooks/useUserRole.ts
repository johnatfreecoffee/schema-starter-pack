import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'Super Admin' | 'Admin' | 'Sales Manager' | 'Technician' | 'Office Staff' | 'Read-Only User' | 'customer' | null;

// Global, singleton subscription and simple cache to avoid duplicate work across multiple hook instances
let globalAuthSubscribed = false;
let lastFetchedUserId: string | null = null;
let lastFetchedAt = 0;
let globalListeners: Array<() => void> = []; // notify hook instances to refetch when auth changes

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  useEffect(() => {
    const notifyRefetch = () => {
      // Defer to avoid doing async work inside auth callback
      setTimeout(() => {
        void fetchUserRole();
      }, 0);
    };

    // Register this instance to global listeners
    globalListeners.push(notifyRefetch);

    // Create a single global auth subscription
    if (!globalAuthSubscribed) {
      globalAuthSubscribed = true;
      const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
        // Notify all hook instances to refetch
        globalListeners.forEach((fn) => fn());
      });
      // Intentionally not unsubscribing the global subscription on unmount to avoid re-subscribing storms
      // Supabase client survives for app lifetime
      // window.addEventListener('beforeunload', () => subscription.unsubscribe()); // optional
    }

    const fetchUserRole = async () => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      try {
        // Avoid hammering the auth endpoint across many instances
        const now = Date.now();
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || null;

        if (!userId) {
          setRole(null);
          setLoading(false);
          return;
        }

        // If we recently fetched for this user within 10s, skip re-fetch
        if (lastFetchedUserId === userId && now - lastFetchedAt < 10_000) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_roles')
          .select('role_id, roles(name)')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          // Default to customer if role cannot be fetched (RLS may restrict non-admins)
          setRole('customer');
        } else if (data && (data as any).roles) {
          setRole((data as any).roles.name as UserRole);
        } else {
          setRole('customer');
        }
        lastFetchedUserId = userId;
        lastFetchedAt = now;
      } catch (err) {
        setRole('customer');
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    // Initial fetch
    void fetchUserRole();

    return () => {
      // Remove this instance from listeners
      globalListeners = globalListeners.filter((fn) => fn !== notifyRefetch);
    };
  }, []);

  return { role, loading };
};
