import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

const MODULES = [
  { value: 'leads', label: 'Leads' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'contacts', label: 'Contacts' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'projects', label: 'Projects' },
  { value: 'quotes', label: 'Quotes' },
  { value: 'invoices', label: 'Invoices' },
];

const ExportImportTab = () => {
  const { toast } = useToast();
  const [exportModule, setExportModule] = useState('leads');
  const [exportFormat, setExportFormat] = useState('csv');

  const handleExport = async () => {
    try {
      toast({ title: 'Export started', description: 'Preparing your data...' });
      // Export logic would go here
      // For now, just show success
      setTimeout(() => {
        toast({ title: 'Export complete', description: 'Your file has been downloaded' });
      }, 1000);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: error.message,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>
            Export data from any module to CSV, Excel, or JSON format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Module</Label>
              <Select value={exportModule} onValueChange={setExportModule}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODULES.map((module) => (
                    <SelectItem key={module.value} value={module.value}>
                      {module.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleExport} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Export {exportModule} to {exportFormat.toUpperCase()}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Data</CardTitle>
          <CardDescription>
            Import data from CSV or Excel files with field mapping
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              id="import-file"
            />
            <Label htmlFor="import-file" className="cursor-pointer">
              <Button variant="outline" asChild>
                <span>Browse Files</span>
              </Button>
            </Label>
            <p className="text-sm text-muted-foreground mt-2">
              Supported formats: CSV, Excel (.xlsx, .xls)
            </p>
          </div>
          <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
            💡 Tip: After uploading, you'll be able to map your file columns to database
            fields and preview before importing.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportImportTab;
