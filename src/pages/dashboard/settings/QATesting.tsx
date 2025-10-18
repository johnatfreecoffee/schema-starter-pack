import SettingsTabs from '@/components/layout/SettingsTabs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemHealthCheck } from '@/components/qa/SystemHealthCheck';
import { LinkChecker } from '@/components/qa/LinkChecker';
import { FormTesting } from '@/components/qa/FormTesting';
import { TestDataGenerator } from '@/components/qa/TestDataGenerator';
import { PreLaunchChecklist } from '@/components/qa/PreLaunchChecklist';

const QATesting = () => {
  return (
    <>
      <SettingsTabs />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold">QA Testing & System Health</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive testing and quality assurance dashboard
          </p>
        </div>

        <Tabs defaultValue="health" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="health">System Health</TabsTrigger>
            <TabsTrigger value="links">Link Checker</TabsTrigger>
            <TabsTrigger value="forms">Form Testing</TabsTrigger>
            <TabsTrigger value="testdata">Test Data</TabsTrigger>
            <TabsTrigger value="checklist">Pre-Launch</TabsTrigger>
          </TabsList>

          <TabsContent value="health" className="space-y-4">
            <SystemHealthCheck />
          </TabsContent>

          <TabsContent value="links" className="space-y-4">
            <LinkChecker />
          </TabsContent>

          <TabsContent value="forms" className="space-y-4">
            <FormTesting />
          </TabsContent>

          <TabsContent value="testdata" className="space-y-4">
            <TestDataGenerator />
          </TabsContent>

          <TabsContent value="checklist" className="space-y-4">
            <PreLaunchChecklist />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default QATesting;