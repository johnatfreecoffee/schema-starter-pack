import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SidebarState {
  desktopCollapsed?: boolean;
  expandedSections?: Record<string, boolean>;
  lastRoute?: string;
}

export function useUserPreferences() {
  const [sidebarState, setSidebarState] = useState<SidebarState>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('sidebar_state')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading preferences:', error);
      }

      if (data?.sidebar_state) {
        setSidebarState(data.sidebar_state as SidebarState);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSidebarState = async (newState: Partial<SidebarState>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updatedState = { ...sidebarState, ...newState };
      setSidebarState(updatedState);

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          sidebar_state: updatedState,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving preferences:', error);
        toast({
          title: "Error saving preferences",
          description: "Your sidebar state could not be saved.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving sidebar state:', error);
    }
  };

  return {
    sidebarState,
    saveSidebarState,
    isLoading,
  };
}
