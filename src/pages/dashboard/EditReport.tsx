import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import DataSourceStep from '@/components/admin/reports/DataSourceStep';
import FieldSelectionStep from '@/components/admin/reports/FieldSelectionStep';
import FiltersStep from '@/components/admin/reports/FiltersStep';
import GroupingStep from '@/components/admin/reports/GroupingStep';
import VisualizationStep from '@/components/admin/reports/VisualizationStep';
import ReportPreview from '@/components/admin/reports/ReportPreview';

const STEPS = [
  { id: 1, name: 'Data Source', component: DataSourceStep },
  { id: 2, name: 'Select Fields', component: FieldSelectionStep },
  { id: 3, name: 'Add Filters', component: FiltersStep },
  { id: 4, name: 'Grouping', component: GroupingStep },
  { id: 5, name: 'Visualization', component: VisualizationStep },
  { id: 6, name: 'Save Changes', component: null },
];

const EditReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [reportConfig, setReportConfig] = useState({
    name: '',
    description: '',
    data_source: '',
    selected_fields: [] as string[],
    filters: [] as any[],
    grouping: null as any,
    visualization_type: 'table',
    chart_config: {},
  });

  useEffect(() => {
    loadReport();
  }, [id]);

  async function loadReport() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('Report not found');
        navigate('/dashboard/reports');
        return;
      }

      // Pre-populate all fields
      setReportConfig({
        name: data.name || '',
        description: data.description || '',
        data_source: data.data_source || '',
        selected_fields: (data.selected_fields as string[]) || [],
        filters: (data.filters as any[]) || [],
        grouping: data.grouping as any,
        visualization_type: data.visualization_type || 'table',
        chart_config: (data.chart_config as any) || {},
      });
    } catch (error: any) {
      console.error('Error loading report:', error);
      toast.error('Failed to load report');
      navigate('/dashboard/reports');
    } finally {
      setLoading(false);
    }
  }

  const updateConfig = (updates: Partial<typeof reportConfig>) => {
    setReportConfig(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep === 1 && !reportConfig.data_source) {
      toast.error('Please select a data source');
      return;
    }
    if (currentStep === 2 && reportConfig.selected_fields.length === 0) {
      toast.error('Please select at least one field');
      return;
    }
    if (currentStep === 5 && !reportConfig.visualization_type) {
      toast.error('Please select a visualization type');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSave = async () => {
    if (!reportConfig.name.trim()) {
      toast.error('Please enter a report name');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          name: reportConfig.name,
          description: reportConfig.description,
          data_source: reportConfig.data_source,
          selected_fields: reportConfig.selected_fields,
          filters: reportConfig.filters,
          grouping: reportConfig.grouping,
          visualization_type: reportConfig.visualization_type,
          chart_config: reportConfig.chart_config,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Report updated successfully!');
      navigate(`/dashboard/reports/${id}`);
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  const CurrentStepComponent = STEPS[currentStep - 1]?.component;

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/dashboard/reports/${id}`)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Report
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Edit Report</h1>
          <p className="text-muted-foreground">
            Modify your report configuration
          </p>
        </div>

        {/* Step Indicators */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step.id}
                  </div>
                  <span
                    className={`ml-2 text-sm hidden sm:inline ${
                      currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      currentStep > step.id ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              {currentStep === 6 ? (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="name">Report Name *</Label>
                    <Input
                      id="name"
                      value={reportConfig.name}
                      onChange={(e) => updateConfig({ name: e.target.value })}
                      placeholder="e.g., Monthly Sales Report"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={reportConfig.description}
                      onChange={(e) => updateConfig({ description: e.target.value })}
                      placeholder="Describe what this report shows..."
                      rows={4}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Last modified: {new Date().toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                CurrentStepComponent && (
                  <CurrentStepComponent
                    config={reportConfig}
                    onUpdate={updateConfig}
                  />
                )
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>

                {currentStep === STEPS.length ? (
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                ) : (
                  <Button onClick={handleNext}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h3 className="font-semibold mb-4">Preview</h3>
              <ReportPreview config={reportConfig} />
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EditReport;
