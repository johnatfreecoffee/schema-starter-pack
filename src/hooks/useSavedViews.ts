import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SavedView {
  id: string;
  module: string;
  view_name: string;
  filters: Record<string, any>;
  is_default: boolean;
  created_at: string;
}

export function useSavedViews(module: string) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchViews = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_views')
        .select('*')
        .eq('module', module)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setViews((data || []).map(v => ({
        ...v,
        filters: v.filters as Record<string, any>
      })));
    } catch (error: any) {
      console.error('Error fetching saved views:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViews();
  }, [module]);

  const saveView = async (viewName: string, filters: Record<string, any>, isDefault: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // If setting as default, unset other defaults first
      if (isDefault) {
        await supabase
          .from('saved_views')
          .update({ is_default: false })
          .eq('module', module)
          .eq('user_id', user.id);
      }

      const { error } = await supabase
        .from('saved_views')
        .insert({
          user_id: user.id,
          module,
          view_name: viewName,
          filters,
          is_default: isDefault,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'View saved successfully',
      });

      fetchViews();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteView = async (viewId: string) => {
    try {
      const { error } = await supabase
        .from('saved_views')
        .delete()
        .eq('id', viewId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'View deleted successfully',
      });

      fetchViews();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const setDefaultView = async (viewId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Unset all defaults
      await supabase
        .from('saved_views')
        .update({ is_default: false })
        .eq('module', module)
        .eq('user_id', user.id);

      // Set new default
      const { error } = await supabase
        .from('saved_views')
        .update({ is_default: true })
        .eq('id', viewId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Default view updated',
      });

      fetchViews();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getDefaultView = () => {
    return views.find(v => v.is_default);
  };

  return {
    views,
    loading,
    saveView,
    deleteView,
    setDefaultView,
    getDefaultView,
    refetch: fetchViews,
  };
}
