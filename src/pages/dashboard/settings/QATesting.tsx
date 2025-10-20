import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemHealthCheck } from '@/components/qa/SystemHealthCheck';
import { LinkChecker } from '@/components/qa/LinkChecker';
import { FormTesting } from '@/components/qa/FormTesting';
import { TestDataGenerator } from '@/components/qa/TestDataGenerator';
import { PreLaunchChecklist } from '@/components/qa/PreLaunchChecklist';
import { ErrorLogViewer } from '@/components/qa/ErrorLogViewer';
import { PerformanceMetrics } from '@/components/qa/PerformanceMetrics';
import { SEOAudit } from '@/components/qa/SEOAudit';
import { TemplateValidator } from '@/components/qa/TemplateValidator';

const QATesting = () => {
  return (
    <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold">QA Testing & System Health</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive testing and quality assurance dashboard
          </p>
        </div>

        <Tabs defaultValue="health" className="space-y-6">
          <TabsList className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 w-full">
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
            <TabsTrigger value="testdata">Test Data</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
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

          <TabsContent value="errors" className="space-y-4">
            <ErrorLogViewer />
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <PerformanceMetrics />
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <SEOAudit />
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <TemplateValidator />
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default QATesting;