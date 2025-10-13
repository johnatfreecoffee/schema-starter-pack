import { useEffect } from 'react';
import { cacheService } from '@/lib/cacheService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to warm critical caches on app initialization
 * Runs once per session to preload frequently accessed data
 */
export const useCacheWarming = () => {
  useEffect(() => {
    const warmCache = async () => {
      try {
        console.log('Warming critical caches...');
        
        // Check if cache was already warmed this session
        const cacheWarmed = sessionStorage.getItem('cache_warmed');
        if (cacheWarmed) {
          console.log('Cache already warmed this session');
          return;
        }

        // Warm company settings (used on every page)
        try {
          const { data: company } = await supabase
            .from('company_settings')
            .select('*')
            .single();
          if (company) {
            await cacheService.set('company:settings', company, 24 * 60 * 60 * 1000);
          }
        } catch (error) {
          console.warn('Could not warm company settings cache:', error);
        }

        // Warm services list (for navigation/forms)
        try {
          const result = await supabase
            .from('services')
            .select('id, name, slug, status')
            .eq('status', true)
            .order('name');
          if (result.data) {
            await cacheService.set('services:list', result.data, 60 * 60 * 1000);
          }
        } catch (error) {
          console.warn('Could not warm services cache:', error);
        }

        // Warm service areas list
        try {
          const { data: areas, error: areasError } = await supabase
            .from('service_areas')
            .select('id, city_name, city_slug, display_name, status')
            .eq('status', true)
            .order('display_name');
          if (!areasError && areas) {
            await cacheService.set('areas:list', areas, 60 * 60 * 1000);
          }
        } catch (error) {
          console.warn('Could not warm service areas cache:', error);
        }

        // Warm top 5 generated pages by view count
        try {
          const { data: topPages, error: pagesError } = await supabase
            .from('generated_pages')
            .select('id, url_path, page_title, status, view_count')
            .eq('status', true)
            .order('view_count', { ascending: false })
            .limit(5);

          if (!pagesError && topPages) {
            for (const page of topPages) {
              await cacheService.set(`pages:generated:${page.url_path}`, page, 60 * 60 * 1000);
            }
          }
        } catch (error) {
          console.warn('Could not warm top pages cache:', error);
        }

        // Mark cache as warmed for this session
        sessionStorage.setItem('cache_warmed', 'true');
        console.log('Cache warming complete');
      } catch (error) {
        console.error('Cache warming failed:', error);
      }
    };

    // Run cache warming
    warmCache();
  }, []);
};
