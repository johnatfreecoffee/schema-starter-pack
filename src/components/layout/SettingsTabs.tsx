import { Link, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SettingsTabs = () => {
  const location = useLocation();
  const currentTab = location.pathname.split('/').pop() || 'company';

  const tabs = [
    { value: 'company', label: 'Company' },
    { value: 'ai-training', label: 'AI Training' },
    { value: 'site-settings', label: 'Site Settings' },
    { value: 'services', label: 'Services' },
    { value: 'service-areas', label: 'Service Areas' },
    { value: 'templates', label: 'Templates' },
    { value: 'static-pages', label: 'Static Pages' },
    { value: 'form-fields', label: 'Form Fields' },
    { value: 'email-templates', label: 'Email Templates' },
    { value: 'canned-responses', label: 'Canned Responses' },
    { value: 'ticket-templates', label: 'Ticket Templates' },
    { value: 'auto-assignment', label: 'Auto-Assignment' },
    { value: 'notifications', label: 'Notifications' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'seo', label: 'SEO' },
    { value: 'qa-testing', label: 'QA Testing' },
  ];

  return (
    <div className="border-b bg-background">
      <div className="container mx-auto px-4">
        <Tabs value={currentTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none h-auto p-0 bg-transparent">
            {tabs.map((tab) => (
              <Link key={tab.value} to={`/dashboard/settings/${tab.value}`}>
                <TabsTrigger
                  value={tab.value}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  {tab.label}
                </TabsTrigger>
              </Link>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsTabs;
