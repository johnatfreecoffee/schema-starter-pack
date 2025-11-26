import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDataChanges = () => {
  return useQuery({
    queryKey: ['data-changes-check'],
    queryFn: async () => {
      // Get last republish timestamp from localStorage
      const lastRepublish = localStorage.getItem('last_republish_timestamp');
      const lastRepublishDate = lastRepublish ? new Date(lastRepublish) : null;

      if (!lastRepublishDate) {
        // If never republished, assume changes exist
        return { hasChanges: true, lastRepublish: null };
      }

      // Check company_settings updated_at
      const { data: companyData } = await supabase
        .from('company_settings')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Check services updated_at (max)
      const { data: servicesData } = await supabase
        .from('services')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Check service_areas updated_at (max)
      const { data: areasData } = await supabase
        .from('service_areas')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Compare timestamps
      const companyUpdated = companyData?.updated_at ? new Date(companyData.updated_at) : null;
      const servicesUpdated = servicesData?.updated_at ? new Date(servicesData.updated_at) : null;
      const areasUpdated = areasData?.updated_at ? new Date(areasData.updated_at) : null;

      const hasChanges = 
        (companyUpdated && companyUpdated > lastRepublishDate) ||
        (servicesUpdated && servicesUpdated > lastRepublishDate) ||
        (areasUpdated && areasUpdated > lastRepublishDate);

      return { hasChanges, lastRepublish: lastRepublishDate };
    },
    refetchInterval: 5000, // Check every 5 seconds
  });
};
