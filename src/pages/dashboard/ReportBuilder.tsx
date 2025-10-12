import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
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
  { id: 6, name: 'Save Report', component: null },
];

const ReportBuilder = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
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
      const { data, error } = await supabase
        .from('reports')
        .insert({
          name: reportConfig.name,
          description: reportConfig.description,
          data_source: reportConfig.data_source,
          selected_fields: reportConfig.selected_fields,
          filters: reportConfig.filters,
          grouping: reportConfig.grouping,
          visualization_type: reportConfig.visualization_type,
          chart_config: reportConfig.chart_config,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Report saved successfully!');
      navigate(`/dashboard/reports/${data.id}`);
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  const CurrentStepComponent = STEPS[currentStep - 1]?.component;

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/reports')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reports
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Report</h1>
          <p className="text-muted-foreground">
            Build a custom report in {STEPS.length} simple steps
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
                    {saving ? 'Saving...' : 'Save Report'}
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

export default ReportBuilder;
