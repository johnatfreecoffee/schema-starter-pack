import { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import SettingsTabs from '@/components/layout/SettingsTabs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import HeaderSettings from '@/components/admin/settings/site-settings/HeaderSettings';
import FooterSettings from '@/components/admin/settings/site-settings/FooterSettings';
import BrandTheme from '@/components/admin/settings/site-settings/BrandTheme';

const SiteSettings = () => {
  const [activeTab, setActiveTab] = useState('header');

  return (
    <AdminLayout>
      <SettingsTabs />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Site Settings</h1>
        
        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="header">Header Settings</TabsTrigger>
              <TabsTrigger value="footer">Footer Settings</TabsTrigger>
              <TabsTrigger value="theme">Brand Theme</TabsTrigger>
            </TabsList>

            <TabsContent value="header">
              <HeaderSettings />
            </TabsContent>

            <TabsContent value="footer">
              <FooterSettings />
            </TabsContent>

            <TabsContent value="theme">
              <BrandTheme />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default SiteSettings;
