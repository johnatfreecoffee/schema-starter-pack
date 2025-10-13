import { cacheService } from './cacheService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Cache invalidation utilities
 * Call these when data changes to clear related caches
 */

export const cacheInvalidation = {
  // Company settings changed
  async invalidateCompanySettings() {
    await cacheService.deleteByNamespace('company');
    await cacheService.deleteByNamespace('pages'); // All pages use company data
  },

  // Service changed or deleted
  async invalidateService(serviceId?: string) {
    if (serviceId) {
      await cacheService.delete(`service:${serviceId}`);
    }
    // Always clear pages namespace as services affect generated pages
    await cacheService.deleteByNamespace('services');
    await cacheService.deleteByNamespace('pages');
  },

  // Service area changed or deleted
  async invalidateServiceArea(areaId?: string) {
    if (areaId) {
      await cacheService.delete(`area:${areaId}`);
    }
    // Always clear pages namespace as areas affect generated pages
    await cacheService.deleteByNamespace('areas');
    await cacheService.deleteByNamespace('pages');
  },

  // Template changed
  async invalidateTemplate(templateId?: string) {
    // Templates affect all pages using them - safest to clear all pages
    await cacheService.deleteByNamespace('pages');
    if (templateId) {
      await cacheService.delete(`template:${templateId}`);
    } else {
      await cacheService.deleteByNamespace('templates');
    }
  },

  // Static page changed
  async invalidateStaticPage(slug: string) {
    await cacheService.delete(`page:static:${slug}`);
  },

  // Site settings changed (header, footer, theme, etc.)
  async invalidateSiteSettings() {
    await cacheService.deleteByNamespace('site');
    await cacheService.deleteByNamespace('pages'); // All pages use site settings
  },

  // CRM dashboard data
  async invalidateDashboard(userId?: string) {
    if (userId) {
      await cacheService.delete(`crm:dashboard:${userId}`);
    } else {
      await cacheService.deleteByNamespace('crm');
    }
  },

  // Clear everything
  async invalidateAll() {
    await cacheService.clear();
  },
};

/**
 * Warm critical caches with frequently accessed data
 */
export const warmCriticalCaches = async () => {
  console.log('Warming critical caches...');
  
  try {
    // Warm company settings
    const { data: company } = await supabase
      .from('company_settings')
      .select('*')
      .single();
    if (company) {
      await cacheService.set('company:settings', company, 24 * 60 * 60 * 1000);
    }

    // Warm services list
    const servicesResult = await supabase
      .from('services')
      .select('id, name, slug, status')
      .eq('status', true);
    if (servicesResult.data) {
      await cacheService.set('services:list', servicesResult.data, 60 * 60 * 1000);
    }

    // Warm service areas
    const { data: areas, error: areasError } = await supabase
      .from('service_areas')
      .select('id, city_name, city_slug, display_name, status')
      .eq('status', true);
    if (!areasError && areas) {
      await cacheService.set('areas:list', areas, 60 * 60 * 1000);
    }

    // Warm top 5 generated pages
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

    console.log('Cache warming complete');
  } catch (error) {
    console.error('Cache warming error:', error);
    throw error;
  }
};
