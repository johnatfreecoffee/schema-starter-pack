import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { healthCheckService, HealthReport } from '@/services/healthCheckService';
import { Loader2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const DataHealthTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentReport, setCurrentReport] = useState<HealthReport | null>(null);

  const { data: history } = useQuery({
    queryKey: ['health_history'],
    queryFn: () => healthCheckService.getHealthHistory(),
  });

  const healthCheckMutation = useMutation({
    mutationFn: () => healthCheckService.runHealthCheck(),
    onSuccess: (report) => {
      setCurrentReport(report);
      queryClient.invalidateQueries({ queryKey: ['health_history'] });
      toast({
        title: 'Health check complete',
        description: `Found ${report.totalIssues} issues`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Health check failed',
        description: error.message,
      });
    },
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'low':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
  };

  const getSeverityVariant = (severity: string): 'destructive' | 'default' | 'secondary' => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Run Health Check</CardTitle>
          <CardDescription>
            Scan your data for integrity issues, orphaned records, and validation errors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => healthCheckMutation.mutate()}
            disabled={healthCheckMutation.isPending}
            size="lg"
            className="w-full"
          >
            {healthCheckMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Running Health Check...
              </>
            ) : (
              'Run Health Check Now'
            )}
          </Button>
        </CardContent>
      </Card>

      {currentReport && (
        <Card>
          <CardHeader>
            <CardTitle>Health Check Results</CardTitle>
            <CardDescription>
              Checked: {new Date(currentReport.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentReport.totalIssues === 0 ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>All Good!</AlertTitle>
                <AlertDescription>
                  No data integrity issues found. Your data is healthy.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {currentReport.issues.map((issue, index) => (
                  <Alert 
                    key={index} 
                    variant={issue.severity === 'high' ? 'destructive' : 'default'}
                  >
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(issue.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTitle className="mb-0">{issue.description}</AlertTitle>
                          <Badge variant="outline">{issue.count} records</Badge>
                        </div>
                        <AlertDescription>
                          Table: {issue.table} • Type: {issue.type}
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Health Check History</CardTitle>
          <CardDescription>Recent health checks</CardDescription>
        </CardHeader>
        <CardContent>
          {!history || history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No health checks yet. Run your first check above.
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="font-medium">
                      {new Date(log.checked_at).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {log.issues_found} issues found
                    </div>
                  </div>
                  <Badge variant={log.issues_found === 0 ? 'default' : 'destructive'}>
                    {log.issues_found === 0 ? 'Healthy' : `${log.issues_found} Issues`}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataHealthTab;
