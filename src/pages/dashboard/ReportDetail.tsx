import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { executeReport } from '@/lib/reportEngine';
import { ReportChart } from '@/components/reports/ReportChart';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, Play, Download, Calendar, Edit, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState('weekly');
  const [scheduleRecipients, setScheduleRecipients] = useState('');

  useEffect(() => {
    loadReport();
  }, [id]);

  async function loadReport() {
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (data) {
      setReport(data);
      setScheduleEnabled(data.is_scheduled || false);
      setScheduleFrequency(data.schedule_frequency || 'weekly');
      setScheduleRecipients(data.schedule_recipients?.join(', ') || '');
      // Auto-execute on load
      executeReportNow(data);
    } else if (error) {
      toast.error('Failed to load report');
    }
    setLoading(false);
  }

  async function executeReportNow(reportConfig?: any) {
    const config = reportConfig || report;
    if (!config) return;

    setExecuting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Execute report
      const data = await executeReport({
        dataSource: config.data_source,
        selectedFields: config.selected_fields,
        filters: config.filters,
        grouping: config.grouping
      });

      setReportData(data);

      // Log execution
      if (user) {
        await supabase.from('report_executions').insert({
          report_id: config.id,
          executed_by: user.id,
          result_count: data.length
        });
      }

      toast.success(`Report generated with ${data.length} results`);
    } catch (error: any) {
      console.error('Report execution error:', error);
      toast.error(error.message || 'Failed to execute report');
    } finally {
      setExecuting(false);
    }
  }

  async function exportToCSV() {
    if (!reportData || reportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      const headers = Object.keys(reportData[0]);
      const csv = [
        headers.join(','),
        ...reportData.map(row => 
          headers.map(h => {
            const value = row[h];
            // Escape values that contain commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  }

  async function saveSchedule() {
    if (!report) return;

    try {
      const recipients = scheduleRecipients.split(',').map(e => e.trim()).filter(Boolean);
      
      await supabase
        .from('reports')
        .update({
          is_scheduled: scheduleEnabled,
          schedule_frequency: scheduleFrequency,
          schedule_recipients: recipients
        })
        .eq('id', report.id);

      toast.success('Schedule settings saved');
    } catch (error) {
      toast.error('Failed to save schedule');
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!report) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Report not found</p>
            <Button onClick={() => navigate('/dashboard/reports')} className="mt-4">
              Back to Reports
            </Button>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Button variant="ghost" onClick={() => navigate('/dashboard/reports')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reports
        </Button>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">{report.name}</h1>
            {report.description && (
              <p className="text-muted-foreground mt-2">{report.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => executeReportNow()} disabled={executing}>
              {executing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Run Report
            </Button>
            <Button variant="outline" onClick={exportToCSV} disabled={reportData.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => navigate(`/dashboard/reports/${id}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Scheduling Section */}
        <Card className="mb-6">
          <Collapsible>
            <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span className="font-semibold">Schedule Settings</span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 border-t">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="schedule-toggle">Enable Scheduling</Label>
                    <p className="text-sm text-muted-foreground">Automatically run and email this report</p>
                  </div>
                  <Switch
                    id="schedule-toggle"
                    checked={scheduleEnabled}
                    onCheckedChange={setScheduleEnabled}
                  />
                </div>

                {scheduleEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recipients">Recipients</Label>
                      <Input
                        id="recipients"
                        placeholder="email1@example.com, email2@example.com"
                        value={scheduleRecipients}
                        onChange={(e) => setScheduleRecipients(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter email addresses separated by commas
                      </p>
                    </div>

                    <Button onClick={saveSchedule} className="w-full">
                      Save Schedule
                    </Button>
                  </>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Report Results */}
        <Card className="p-6">
          {executing && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Generating report...</p>
              </div>
            </div>
          )}

          {!executing && reportData.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No data available</p>
              <p className="text-sm mt-2">Click "Run Report" to generate results</p>
            </div>
          )}

          {!executing && reportData.length > 0 && (
            <>
              {report.visualization_type !== 'table' ? (
                <ReportChart
                  type={report.visualization_type}
                  data={reportData}
                  config={report.chart_config}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        {Object.keys(reportData[0]).map(key => (
                          <th key={key} className="text-left p-3 font-semibold bg-muted/50">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((row, i) => (
                        <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                          {Object.values(row).map((val: any, j) => (
                            <td key={j} className="p-3">
                              {typeof val === 'number' ? val.toLocaleString() : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-4 text-sm text-muted-foreground text-right">
                Total records: {reportData.length}
              </div>
            </>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ReportDetail;
