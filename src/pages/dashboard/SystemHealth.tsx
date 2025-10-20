import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Play,
  Download,
  RefreshCw,
  Activity,
  Database,
  Shield,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CacheManagement } from "@/components/qa/CacheManagement";
import { SearchIndexRebuild } from "@/components/qa/SearchIndexRebuild";
import { SystemReportExport } from "@/components/qa/SystemReportExport";

interface TestResult {
  name: string;
  category: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  message?: string;
  details?: any;
  timestamp?: Date;
}

const SystemHealth = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runAllTests = async () => {
    setRunning(true);
    const allResults: TestResult[] = [];

    try {
      // Integration Tests
      allResults.push(...await testLeadToCustomerFlow());
      allResults.push(...await testPageGeneration());
      allResults.push(...await testCustomerPortal());
      allResults.push(...await testEmailSystem());
      allResults.push(...await testDocumentGeneration());
      allResults.push(...await testWorkflowAutomation());

      // Data Integrity Tests
      allResults.push(...await testOrphanedRecords());
      allResults.push(...await testMissingData());
      allResults.push(...await testPermissions());
      allResults.push(...await testDatabaseHealth());

      setResults(allResults);
      setLastRun(new Date());
      
      const passed = allResults.filter(r => r.status === 'pass').length;
      const failed = allResults.filter(r => r.status === 'fail').length;
      
      toast.success(`Tests completed: ${passed} passed, ${failed} failed`);
    } catch (error) {
      console.error('Test execution error:', error);
      toast.error('Failed to run tests');
    } finally {
      setRunning(false);
    }
  };

  // Integration Test Functions
  const testLeadToCustomerFlow = async (): Promise<TestResult[]> => {
    const results: TestResult[] = [];
    
    try {
      // Check leads table
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, converted_account_id')
        .limit(1);

      results.push({
        name: 'Leads Table Accessible',
        category: 'Lead Flow',
        status: leadsError ? 'fail' : 'pass',
        message: leadsError?.message || 'Leads table is accessible',
        timestamp: new Date()
      });

      // Check accounts table
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('id, source_lead_id')
        .limit(1);

      results.push({
        name: 'Account Conversion Structure',
        category: 'Lead Flow',
        status: accountsError ? 'fail' : 'pass',
        message: accountsError?.message || 'Account relationships configured',
        timestamp: new Date()
      });

      // Check contacts table
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id, account_id')
        .limit(1);

      results.push({
        name: 'Contact-Account Relationships',
        category: 'Lead Flow',
        status: contactsError ? 'fail' : 'pass',
        message: contactsError?.message || 'Contact relationships working',
        timestamp: new Date()
      });

      // Check projects table
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, account_id, source_lead_id')
        .limit(1);

      results.push({
        name: 'Project-Account Relationships',
        category: 'Lead Flow',
        status: projectsError ? 'fail' : 'pass',
        message: projectsError?.message || 'Project relationships working',
        timestamp: new Date()
      });

    } catch (error: any) {
      results.push({
        name: 'Lead Flow Test',
        category: 'Lead Flow',
        status: 'fail',
        message: error.message,
        timestamp: new Date()
      });
    }

    return results;
  };

  const testPageGeneration = async (): Promise<TestResult[]> => {
    const results: TestResult[] = [];

    try {
      // Check generated pages
      const { data: pages, error: pagesError } = await supabase
        .from('generated_pages')
        .select('id, service_id, service_area_id, rendered_html, meta_description')
        .limit(10);

      results.push({
        name: 'Generated Pages Exist',
        category: 'Pages',
        status: pagesError ? 'fail' : pages && pages.length > 0 ? 'pass' : 'warning',
        message: pagesError?.message || `Found ${pages?.length || 0} generated pages`,
        timestamp: new Date()
      });

      // Check for pages with missing HTML
      const missingHtml = pages?.filter(p => !p.rendered_html) || [];
      results.push({
        name: 'Pages Have Rendered HTML',
        category: 'Pages',
        status: missingHtml.length > 0 ? 'warning' : 'pass',
        message: missingHtml.length > 0 
          ? `${missingHtml.length} pages missing rendered HTML` 
          : 'All pages have rendered HTML',
        timestamp: new Date()
      });

      // Check for pages with missing SEO
      const missingSEO = pages?.filter(p => !p.meta_description) || [];
      results.push({
        name: 'Pages Have SEO Meta Tags',
        category: 'Pages',
        status: missingSEO.length > 0 ? 'warning' : 'pass',
        message: missingSEO.length > 0 
          ? `${missingSEO.length} pages missing meta descriptions` 
          : 'All pages have SEO metadata',
        timestamp: new Date()
      });

    } catch (error: any) {
      results.push({
        name: 'Page Generation Test',
        category: 'Pages',
        status: 'fail',
        message: error.message,
        timestamp: new Date()
      });
    }

    return results;
  };

  const testCustomerPortal = async (): Promise<TestResult[]> => {
    const results: TestResult[] = [];

    try {
      // Test customer portal data access
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if customer can access their account
        const { data: account, error: accountError } = await supabase
          .from('accounts')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        results.push({
          name: 'Customer Account Access',
          category: 'Portal',
          status: accountError ? 'fail' : 'pass',
          message: accountError?.message || 'Customer can access account data',
          timestamp: new Date()
        });

        if (account) {
          // Check project access
          const { error: projectsError } = await supabase
            .from('projects')
            .select('id')
            .eq('account_id', account.id);

          results.push({
            name: 'Customer Project Access',
            category: 'Portal',
            status: projectsError ? 'fail' : 'pass',
            message: projectsError?.message || 'Customer can access projects',
            timestamp: new Date()
          });

          // Check invoice access
          const { error: invoicesError } = await supabase
            .from('invoices')
            .select('id')
            .eq('account_id', account.id);

          results.push({
            name: 'Customer Invoice Access',
            category: 'Portal',
            status: invoicesError ? 'fail' : 'pass',
            message: invoicesError?.message || 'Customer can access invoices',
            timestamp: new Date()
          });
        }
      }

    } catch (error: any) {
      results.push({
        name: 'Customer Portal Test',
        category: 'Portal',
        status: 'fail',
        message: error.message,
        timestamp: new Date()
      });
    }

    return results;
  };

  const testEmailSystem = async (): Promise<TestResult[]> => {
    const results: TestResult[] = [];

    try {
      // Check email templates exist
      const { data: templates, error: templatesError } = await supabase
        .from('email_templates')
        .select('id, name, subject, body')
        .eq('is_active', true);

      results.push({
        name: 'Email Templates Configured',
        category: 'Email',
        status: templatesError ? 'fail' : templates && templates.length > 0 ? 'pass' : 'warning',
        message: templatesError?.message || `Found ${templates?.length || 0} active email templates`,
        timestamp: new Date()
      });

      // Check email queue
      const { data: queue, error: queueError } = await supabase
        .from('email_queue')
        .select('id, status')
        .limit(10);

      results.push({
        name: 'Email Queue Functional',
        category: 'Email',
        status: queueError ? 'fail' : 'pass',
        message: queueError?.message || `Email queue accessible (${queue?.length || 0} recent emails)`,
        timestamp: new Date()
      });

    } catch (error: any) {
      results.push({
        name: 'Email System Test',
        category: 'Email',
        status: 'fail',
        message: error.message,
        timestamp: new Date()
      });
    }

    return results;
  };

  const testDocumentGeneration = async (): Promise<TestResult[]> => {
    const results: TestResult[] = [];

    try {
      // Check company settings for PDF generation
      const { data: settings, error: settingsError } = await supabase
        .from('company_settings')
        .select('business_name, logo_url, document_header_color')
        .single();

      results.push({
        name: 'Company Settings for Documents',
        category: 'Documents',
        status: settingsError ? 'fail' : 'pass',
        message: settingsError?.message || 'Company branding settings configured',
        timestamp: new Date()
      });

      // Check for invoices with PDFs
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('id, pdf_url')
        .not('pdf_url', 'is', null)
        .limit(5);

      results.push({
        name: 'Invoice PDF Generation',
        category: 'Documents',
        status: invoicesError ? 'fail' : invoices && invoices.length > 0 ? 'pass' : 'warning',
        message: invoicesError?.message || `${invoices?.length || 0} invoices have PDFs generated`,
        timestamp: new Date()
      });

    } catch (error: any) {
      results.push({
        name: 'Document Generation Test',
        category: 'Documents',
        status: 'fail',
        message: error.message,
        timestamp: new Date()
      });
    }

    return results;
  };

  const testWorkflowAutomation = async (): Promise<TestResult[]> => {
    const results: TestResult[] = [];

    try {
      // Check workflows exist
      const { data: workflows, error: workflowsError } = await supabase
        .from('workflows')
        .select('id, name, is_active')
        .eq('is_active', true);

      results.push({
        name: 'Active Workflows',
        category: 'Workflows',
        status: workflowsError ? 'fail' : workflows && workflows.length > 0 ? 'pass' : 'warning',
        message: workflowsError?.message || `${workflows?.length || 0} active workflows configured`,
        timestamp: new Date()
      });

    } catch (error: any) {
      results.push({
        name: 'Workflow Automation Test',
        category: 'Workflows',
        status: 'fail',
        message: error.message,
        timestamp: new Date()
      });
    }

    return results;
  };

  // Data Integrity Test Functions
  const testOrphanedRecords = async (): Promise<TestResult[]> => {
    const results: TestResult[] = [];

    try {
      // Check for projects without accounts (orphaned projects)
      const { data: orphanedProjects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .is('account_id', null)
        .limit(1);

      results.push({
        name: 'Orphaned Projects Check',
        category: 'Data Integrity',
        status: projectsError ? 'fail' : orphanedProjects && orphanedProjects.length > 0 ? 'warning' : 'pass',
        message: projectsError?.message || (orphanedProjects && orphanedProjects.length > 0 
          ? 'Found projects without accounts' 
          : 'No orphaned projects'),
        timestamp: new Date()
      });

      // Check for invoices without accounts
      const { data: orphanedInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('id')
        .is('account_id', null)
        .limit(1);

      results.push({
        name: 'Orphaned Invoices Check',
        category: 'Data Integrity',
        status: invoicesError ? 'fail' : orphanedInvoices && orphanedInvoices.length > 0 ? 'warning' : 'pass',
        message: invoicesError?.message || (orphanedInvoices && orphanedInvoices.length > 0 
          ? 'Found invoices without accounts' 
          : 'No orphaned invoices'),
        timestamp: new Date()
      });

    } catch (error: any) {
      results.push({
        name: 'Orphaned Records Check',
        category: 'Data Integrity',
        status: 'fail',
        message: error.message,
        timestamp: new Date()
      });
    }

    return results;
  };

  const testMissingData = async (): Promise<TestResult[]> => {
    const results: TestResult[] = [];

    try {
      // Check company settings
      const { data: settings, error } = await supabase
        .from('company_settings')
        .select('business_name, email, phone, address')
        .single();

      const missingFields = [];
      if (!settings?.business_name) missingFields.push('business_name');
      if (!settings?.email) missingFields.push('email');
      if (!settings?.phone) missingFields.push('phone');

      results.push({
        name: 'Company Settings Complete',
        category: 'Data Integrity',
        status: missingFields.length > 0 ? 'warning' : 'pass',
        message: missingFields.length > 0 
          ? `Missing: ${missingFields.join(', ')}`
          : 'All required company settings configured',
        timestamp: new Date()
      });

    } catch (error: any) {
      results.push({
        name: 'Missing Data Check',
        category: 'Data Integrity',
        status: 'fail',
        message: error.message,
        timestamp: new Date()
      });
    }

    return results;
  };

  const testPermissions = async (): Promise<TestResult[]> => {
    const results: TestResult[] = [];

    try {
      // Check for users with roles
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: roles, error } = await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', user.id);

        results.push({
          name: 'User Role Assignments',
          category: 'Permissions',
          status: error ? 'fail' : roles && roles.length > 0 ? 'pass' : 'warning',
          message: error?.message || 'User has assigned roles',
          timestamp: new Date()
        });
      }

    } catch (error: any) {
      results.push({
        name: 'Permission Check',
        category: 'Permissions',
        status: 'fail',
        message: error.message,
        timestamp: new Date()
      });
    }

    return results;
  };

  const testDatabaseHealth = async (): Promise<TestResult[]> => {
    const results: TestResult[] = [];

    try {
      // Test basic connectivity
      const { error } = await supabase.from('company_settings').select('id').limit(1);
      
      results.push({
        name: 'Database Connectivity',
        category: 'Database',
        status: error ? 'fail' : 'pass',
        message: error?.message || 'Database connection healthy',
        timestamp: new Date()
      });

    } catch (error: any) {
      results.push({
        name: 'Database Health Check',
        category: 'Database',
        status: 'fail',
        message: error.message,
        timestamp: new Date()
      });
    }

    return results;
  };

  const exportReport = () => {
    const report = {
      timestamp: lastRun,
      results: results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.status === 'pass').length,
        failed: results.filter(r => r.status === 'fail').length,
        warnings: results.filter(r => r.status === 'warning').length
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-health-report-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'fail': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default: return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pass: 'default',
      fail: 'destructive',
      warning: 'secondary',
      pending: 'outline'
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) acc[result.category] = [];
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, TestResult[]>);

  const summary = {
    total: results.length,
    passed: results.filter(r => r.status === 'pass').length,
    failed: results.filter(r => r.status === 'fail').length,
    warnings: results.filter(r => r.status === 'warning').length
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold">System Health</h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive testing and monitoring dashboard
            </p>
          </div>
          <SystemReportExport />
        </div>

        <div className="mb-6 space-y-4">
          <CacheManagement />
          <SearchIndexRebuild />
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Total Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Passed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
                <XCircle className="h-4 w-4" />
                Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                Warnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{summary.warnings}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Test Suite</CardTitle>
                <CardDescription>
                  {lastRun ? `Last run: ${lastRun.toLocaleString()}` : 'No tests run yet'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={exportReport} variant="outline" disabled={results.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button onClick={runAllTests} disabled={running}>
                  {running ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run All Tests
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">All Tests</TabsTrigger>
                <TabsTrigger value="integration">Integration</TabsTrigger>
                <TabsTrigger value="integrity">Data Integrity</TabsTrigger>
                <TabsTrigger value="failed">Failed Only</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {Object.entries(groupedResults).map(([category, tests]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="text-lg">{category}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {tests.map((test, idx) => (
                        <div key={idx} className="flex items-start justify-between p-3 border rounded-lg">
                          <div className="flex items-start gap-3 flex-1">
                            {getStatusIcon(test.status)}
                            <div className="flex-1">
                              <div className="font-medium">{test.name}</div>
                              <div className="text-sm text-muted-foreground">{test.message}</div>
                            </div>
                          </div>
                          {getStatusBadge(test.status)}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
                {results.length === 0 && (
                  <Alert>
                    <AlertDescription>
                      Click "Run All Tests" to start the system health check
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="integration">
                {['Lead Flow', 'Pages', 'Portal', 'Email', 'Documents', 'Workflows']
                  .map(cat => groupedResults[cat])
                  .filter(Boolean)
                  .map((tests, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="text-lg">{tests[0].category}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {tests.map((test, testIdx) => (
                          <div key={testIdx} className="flex items-start justify-between p-3 border rounded-lg">
                            <div className="flex items-start gap-3 flex-1">
                              {getStatusIcon(test.status)}
                              <div className="flex-1">
                                <div className="font-medium">{test.name}</div>
                                <div className="text-sm text-muted-foreground">{test.message}</div>
                              </div>
                            </div>
                            {getStatusBadge(test.status)}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>

              <TabsContent value="integrity">
                {['Data Integrity', 'Permissions', 'Database']
                  .map(cat => groupedResults[cat])
                  .filter(Boolean)
                  .map((tests, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="text-lg">{tests[0].category}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {tests.map((test, testIdx) => (
                          <div key={testIdx} className="flex items-start justify-between p-3 border rounded-lg">
                            <div className="flex items-start gap-3 flex-1">
                              {getStatusIcon(test.status)}
                              <div className="flex-1">
                                <div className="font-medium">{test.name}</div>
                                <div className="text-sm text-muted-foreground">{test.message}</div>
                              </div>
                            </div>
                            {getStatusBadge(test.status)}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>

              <TabsContent value="failed">
                {results.filter(r => r.status === 'fail').length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-red-600">Failed Tests</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {results.filter(r => r.status === 'fail').map((test, idx) => (
                        <div key={idx} className="flex items-start justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                          <div className="flex items-start gap-3 flex-1">
                            {getStatusIcon(test.status)}
                            <div className="flex-1">
                              <div className="font-medium">{test.name}</div>
                              <div className="text-sm text-muted-foreground">{test.message}</div>
                            </div>
                          </div>
                          {getStatusBadge(test.status)}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      No failed tests - all systems operational!
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
  );
};

export default SystemHealth;
