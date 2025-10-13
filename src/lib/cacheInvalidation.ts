import { cacheService } from './cacheService';

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
