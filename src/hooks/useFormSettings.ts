import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useFormSettings = () => {
  return useQuery({
    queryKey: ['form-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_settings')
        .select('*')
        .eq('form_type', 'lead_form')
        .single();

      if (error) throw error;
      return data;
    },
  });
};
