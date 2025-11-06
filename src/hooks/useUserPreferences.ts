import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SidebarState {
  desktopCollapsed?: boolean;
  expandedSections?: Record<string, boolean>;
  lastRoute?: string;
}

export interface AIEditorPreferences {
  editorMode?: 'chat' | 'build';
  selectedModel?: 'makecom' | 'openrouter';
}

export function useUserPreferences() {
  const [sidebarState, setSidebarState] = useState<SidebarState>({});
  const [aiEditorPreferences, setAiEditorPreferences] = useState<AIEditorPreferences>({});
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
        .select('sidebar_state, ai_editor_preferences')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading preferences:', error);
      }

      if (data?.sidebar_state) {
        setSidebarState(data.sidebar_state as SidebarState);
      }
      
      if (data?.ai_editor_preferences) {
        setAiEditorPreferences(data.ai_editor_preferences as AIEditorPreferences);
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

  const saveAiEditorPreferences = async (newPreferences: Partial<AIEditorPreferences>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updatedPreferences = { ...aiEditorPreferences, ...newPreferences };
      setAiEditorPreferences(updatedPreferences);

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ai_editor_preferences: updatedPreferences,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving AI editor preferences:', error);
      }
    } catch (error) {
      console.error('Error saving AI editor preferences:', error);
    }
  };

  return {
    sidebarState,
    saveSidebarState,
    aiEditorPreferences,
    saveAiEditorPreferences,
    isLoading,
  };
}
