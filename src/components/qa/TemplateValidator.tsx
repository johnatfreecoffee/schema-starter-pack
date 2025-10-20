import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { validateAllTemplates, getValidationSummary, TemplateValidation } from '@/lib/templateValidator';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const TemplateValidator = () => {
  const [validating, setValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<TemplateValidation[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateValidation | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates-validation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('id, name, content');

      if (error) throw error;
      return data || [];
    }
  });

  const runValidation = async () => {
    if (!templates || templates.length === 0) {
      toast.error('No templates to validate');
      return;
    }

    setValidating(true);
    try {
      const results = await validateAllTemplates(templates);
      setValidationResults(results);
      
      const summary = getValidationSummary(results);
      if (summary.totalErrors === 0) {
        toast.success('All templates are valid!');
      } else {
        toast.warning(`Found ${summary.totalErrors} errors in ${summary.invalidTemplates} templates`);
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to validate templates');
    } finally {
      setValidating(false);
    }
  };

  const exportValidationReport = () => {
    if (validationResults.length === 0) {
      toast.error('No validation results to export');
      return;
    }

    const csv = [
      ['Template', 'Status', 'Variables', 'Errors', 'Warnings'].join(','),
      ...validationResults.map(result => [
        result.templateName,
        result.isValid ? 'Valid' : 'Invalid',
        result.totalVariables,
        result.errors.length,
        result.warnings.length
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-validation-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Validation report exported');
  };

  const summary = validationResults.length > 0 ? getValidationSummary(validationResults) : null;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Template Validator</CardTitle>
              <CardDescription>
                Check all templates for syntax errors and undefined variables
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={runValidation}
                disabled={validating || isLoading}
              >
                {validating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Validate All
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={exportValidationReport}
                disabled={validationResults.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : validationResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Click "Validate All" to check templates</p>
              <p className="text-sm mt-2">{templates?.length || 0} templates available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{summary.healthScore}%</div>
                      <p className="text-sm text-muted-foreground">Health Score</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">
                        {summary.validTemplates}
                      </div>
                      <p className="text-sm text-muted-foreground">Valid Templates</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-red-600">
                        {summary.totalErrors}
                      </div>
                      <p className="text-sm text-muted-foreground">Total Errors</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-yellow-600">
                        {summary.totalWarnings}
                      </div>
                      <p className="text-sm text-muted-foreground">Warnings</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Template Results */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Template Results</h3>
                <div className="space-y-2">
                  {validationResults.map((result) => (
                    <div
                      key={result.templateId}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedTemplate(result)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {result.isValid ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium">{result.templateName}</p>
                          <p className="text-sm text-muted-foreground">
                            {result.totalVariables} variables used
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.errors.length > 0 && (
                          <Badge variant="destructive">{result.errors.length} errors</Badge>
                        )}
                        {result.warnings.length > 0 && (
                          <Badge variant="default" className="bg-yellow-500">
                            {result.warnings.length} warnings
                          </Badge>
                        )}
                        {result.isValid && (
                          <Badge variant="default" className="bg-green-600">Valid</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Template Report Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.templateName}</DialogTitle>
            <DialogDescription>
              {selectedTemplate?.totalVariables} variables •{' '}
              {selectedTemplate?.errors.length} errors •{' '}
              {selectedTemplate?.warnings.length} warnings
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              {selectedTemplate.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    Errors
                  </h4>
                  <div className="space-y-2">
                    {selectedTemplate.errors.map((error, i) => (
                      <div key={i} className="p-3 border border-red-200 rounded bg-red-50">
                        <div className="flex items-start justify-between mb-1">
                          <Badge variant="destructive" className="text-xs">
                            {error.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Line {error.line}, Col {error.column}
                          </span>
                        </div>
                        <p className="text-sm">{error.message}</p>
                        {error.variable && (
                          <code className="text-xs bg-red-100 px-2 py-1 rounded mt-2 block">
                            {error.variable}
                          </code>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTemplate.warnings.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Warnings
                  </h4>
                  <div className="space-y-2">
                    {selectedTemplate.warnings.map((warning, i) => (
                      <div key={i} className="p-3 border border-yellow-200 rounded bg-yellow-50">
                        <p className="text-sm">{warning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTemplate.isValid && (
                <div className="text-center py-6 text-green-600">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2" />
                  <p className="font-semibold">Template is valid!</p>
                  <p className="text-sm text-muted-foreground">
                    All variables are properly defined and syntax is correct
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
