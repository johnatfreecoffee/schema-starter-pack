import { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, FileText, Link2, FileCode, Search } from 'lucide-react';
import { GlobalSEOSettings } from '@/components/admin/seo/GlobalSEOSettings';
import { PageSEOManager } from '@/components/admin/seo/PageSEOManager';
import { SEOTemplates } from '@/components/admin/seo/SEOTemplates';
import { RedirectsManager } from '@/components/admin/seo/RedirectsManager';
import { SitemapRobots } from '@/components/admin/seo/SitemapRobots';

const SEO = () => {
  const [activeTab, setActiveTab] = useState('global');

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">SEO Management</h1>
          <p className="text-muted-foreground">
            Optimize your website for search engines and manage meta tags
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="global" className="gap-2">
              <Globe className="h-4 w-4" />
              Global Settings
            </TabsTrigger>
            <TabsTrigger value="pages" className="gap-2">
              <FileText className="h-4 w-4" />
              Page SEO
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <Search className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="redirects" className="gap-2">
              <Link2 className="h-4 w-4" />
              Redirects
            </TabsTrigger>
            <TabsTrigger value="sitemap" className="gap-2">
              <FileCode className="h-4 w-4" />
              Sitemap & Robots
            </TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="mt-6">
            <GlobalSEOSettings />
          </TabsContent>

          <TabsContent value="pages" className="mt-6">
            <PageSEOManager />
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <SEOTemplates />
          </TabsContent>

          <TabsContent value="redirects" className="mt-6">
            <RedirectsManager />
          </TabsContent>

          <TabsContent value="sitemap" className="mt-6">
            <SitemapRobots />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default SEO;
