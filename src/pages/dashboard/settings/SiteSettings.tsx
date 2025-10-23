import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import HeaderSettings from '@/components/admin/settings/site-settings/HeaderSettings';
import FooterSettings from '@/components/admin/settings/site-settings/FooterSettings';
import BrandTheme from '@/components/admin/settings/site-settings/BrandTheme';
import ReviewSettings from '@/components/admin/settings/site-settings/ReviewSettings';
import { WebsiteInfoSettings } from '@/components/admin/settings/site-settings/WebsiteInfoSettings';

const SiteSettings = () => {
  const [activeTab, setActiveTab] = useState('website-info');

  return (
    <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Site Settings</h1>
        
        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="website-info">Website Info</TabsTrigger>
              <TabsTrigger value="header">Header</TabsTrigger>
              <TabsTrigger value="footer">Footer</TabsTrigger>
              <TabsTrigger value="theme">Brand Theme</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="website-info">
              <WebsiteInfoSettings />
            </TabsContent>

            <TabsContent value="header">
              <HeaderSettings />
            </TabsContent>

            <TabsContent value="footer">
              <FooterSettings />
            </TabsContent>

            <TabsContent value="theme">
              <BrandTheme />
            </TabsContent>

            <TabsContent value="reviews">
              <ReviewSettings />
            </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default SiteSettings;
