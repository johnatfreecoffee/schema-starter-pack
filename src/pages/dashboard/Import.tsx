import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, MapPin, CheckCircle, AlertCircle, History, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImportService } from '@/services/importService';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';

type ImportModule = 'leads' | 'contacts' | 'accounts';
type ImportStep = 'upload' | 'mapping' | 'preview';

interface ColumnMapping {
  csvColumn: string;
  dbColumn: string;
}

interface DefaultValue {
  field: string;
  value: string;
}

interface Service {
  id: string;
  name: string;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' }
];

const moduleFields: Record<ImportModule, { field: string; label: string; required: boolean }[]> = {
  leads: [
    { field: 'first_name', label: 'First Name', required: true },
    { field: 'last_name', label: 'Last Name', required: true },
    { field: 'email', label: 'Email', required: true },
    { field: 'phone', label: 'Phone', required: true },
    { field: 'service_needed', label: 'Service Needed', required: true },
    { field: 'street_address', label: 'Street Address', required: true },
    { field: 'unit', label: 'Unit/Apt', required: false },
    { field: 'city', label: 'City', required: true },
    { field: 'state', label: 'State', required: true },
    { field: 'zip', label: 'ZIP Code', required: true },
    { field: 'project_details', label: 'Project Details', required: false },
    { field: 'status', label: 'Status', required: false },
  ],
  contacts: [
    { field: 'first_name', label: 'First Name', required: true },
    { field: 'last_name', label: 'Last Name', required: true },
    { field: 'email', label: 'Email', required: true },
    { field: 'phone', label: 'Phone', required: true },
    { field: 'account_id', label: 'Account ID', required: true },
    { field: 'title', label: 'Title', required: false },
    { field: 'mobile', label: 'Mobile', required: false },
    { field: 'department', label: 'Department', required: false },
    { field: 'is_primary', label: 'Is Primary', required: false },
  ],
  accounts: [
    { field: 'account_name', label: 'Account Name', required: true },
    { field: 'industry', label: 'Industry', required: false },
    { field: 'website', label: 'Website', required: false },
    { field: 'notes', label: 'Notes', required: false },
    { field: 'status', label: 'Status', required: false },
  ],
};

const Import = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<ImportStep>('upload');
  const [module, setModule] = useState<ImportModule>('leads');
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [defaultValues, setDefaultValues] = useState<DefaultValue[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<any>(null);

  useEffect(() => {
    if (module === 'leads') {
      loadServices();
      // Set default values for leads
      setDefaultValues([
        { field: 'status', value: 'new' },
        { field: 'service_needed', value: '' }
      ]);
    }
  }, [module]);

  const loadServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    
    if (data && data.length > 0) {
      setServices(data);
      // Set first service as default for service_needed
      setDefaultValues(prev => 
        prev.map(dv => dv.field === 'service_needed' ? { ...dv, value: data[0].name } : dv)
      );
    }
  };

  const handleDefaultValueChange = (field: string, value: string) => {
    setDefaultValues(prev => {
      const existing = prev.find(dv => dv.field === field);
      if (existing) {
        return prev.map(dv => dv.field === field ? { ...dv, value } : dv);
      }
      return [...prev, { field, value }];
    });
  };

  const getFieldDefaultValue = (field: string): string => {
    return defaultValues.find(dv => dv.field === field)?.value || '';
  };

  const isFieldMapped = (field: string): boolean => {
    const mapping = columnMappings.find(m => m.dbColumn === field);
    return mapping !== undefined && mapping.csvColumn !== '__skip__' && mapping.csvColumn !== '';
  };

  const getUnmappedRequiredCount = (field: string): number => {
    if (isFieldMapped(field)) return 0;
    return csvData.length;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.csv')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      });
      return;
    }

    try {
      const data = await ImportService.parseCSV(uploadedFile);
      if (data.length === 0) {
        toast({
          title: 'Empty File',
          description: 'The CSV file is empty',
          variant: 'destructive',
        });
        return;
      }

      setFile(uploadedFile);
      setCsvData(data);
      setCsvHeaders(Object.keys(data[0]));
      
      // Auto-map columns by name similarity
      const autoMappings: ColumnMapping[] = [];
      const fields = moduleFields[module];
      
      fields.forEach(({ field }) => {
        const csvColumn = Object.keys(data[0]).find(
          key => key.toLowerCase().replace(/[_\s]/g, '') === field.toLowerCase().replace(/[_\s]/g, '')
        );
        if (csvColumn) {
          autoMappings.push({ csvColumn, dbColumn: field });
        }
      });
      
      setColumnMappings(autoMappings);
      setStep('mapping');
      
      toast({
        title: 'File Uploaded',
        description: `${data.length} rows detected`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleMappingChange = (dbColumn: string, csvColumn: string) => {
    setColumnMappings(prev => {
      const existing = prev.find(m => m.dbColumn === dbColumn);
      if (existing) {
        return prev.map(m => m.dbColumn === dbColumn ? { ...m, csvColumn } : m);
      }
      return [...prev, { dbColumn, csvColumn }];
    });
  };

  const validateMappings = (): boolean => {
    const requiredFields = moduleFields[module].filter(f => f.required);
    const mappedFields = columnMappings.map(m => m.dbColumn);
    const missingFields = requiredFields.filter(f => !mappedFields.includes(f.field));
    
    if (missingFields.length > 0) {
      toast({
        title: 'Missing Required Fields',
        description: `Please map: ${missingFields.map(f => f.label).join(', ')}`,
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleImport = async () => {
    if (!validateMappings()) return;

    setImporting(true);
    setImportProgress(0);

    try {
      let result;
      const options = { 
        skipDuplicates, 
        updateExisting,
        defaultValues: Object.fromEntries(defaultValues.map(dv => [dv.field, dv.value]))
      };

      if (module === 'leads') {
        result = await ImportService.importLeads(csvData, columnMappings, options);
      } else if (module === 'contacts') {
        result = await ImportService.importContacts(csvData, columnMappings, options);
      } else {
        result = await ImportService.importAccounts(csvData, columnMappings, options);
      }

      setImportResult(result);
      setImportProgress(100);

      // Save to import history
      await ImportService.saveImportHistory(
        module,
        file?.name || 'unknown',
        result,
        { skipDuplicates, updateExisting, columnMappings }
      );

      toast({
        title: 'Import Complete',
        description: `${result.successful} records imported successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setStep('upload');
    setFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setColumnMappings([]);
    setImportResult(null);
    setImportProgress(0);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold">Import Data</h1>
            <p className="text-muted-foreground mt-1">
              Bulk import records from CSV files
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard/import/history')}>
            <History className="mr-2 h-4 w-4" />
            Import History
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-primary' : (step === 'mapping' || step === 'preview') ? 'text-green-600' : 'text-muted-foreground'}`}>
              {step !== 'upload' ? <CheckCircle className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
              <span className="font-medium">Upload</span>
            </div>
            <div className="w-16 h-px bg-border" />
            <div className={`flex items-center gap-2 ${step === 'mapping' ? 'text-primary' : step === 'preview' ? 'text-green-600' : 'text-muted-foreground'}`}>
              {step === 'preview' ? <CheckCircle className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
              <span className="font-medium">Map Columns</span>
            </div>
            <div className="w-16 h-px bg-border" />
            <div className={`flex items-center gap-2 ${step === 'preview' ? 'text-primary' : 'text-muted-foreground'}`}>
              <FileText className="h-5 w-5" />
              <span className="font-medium">Preview & Import</span>
            </div>
          </div>
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <Card className="p-8">
            <div className="space-y-6">
              <div>
                <Label>Select Module</Label>
                <Select value={module} onValueChange={(value) => setModule(value as ImportModule)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leads">Leads</SelectItem>
                    <SelectItem value="contacts">Contacts</SelectItem>
                    <SelectItem value="accounts">Accounts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop or click to browse
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload">
                  <Button asChild>
                    <span>Choose File</span>
                  </Button>
                </label>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Required Columns for {module}:</h4>
                <ul className="text-sm space-y-1">
                  {moduleFields[module]
                    .filter(f => f.required)
                    .map(f => (
                      <li key={f.field} className="text-muted-foreground">• {f.label}</li>
                    ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Column Mapping */}
        {step === 'mapping' && (
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Map CSV Columns to Database Fields</h3>
                <div className="space-y-4">
                  {moduleFields[module].map(({ field, label, required }) => {
                    const hasChoices = field === 'status' || field === 'service_needed';
                    const isMapped = isFieldMapped(field);
                    const unmappedCount = getUnmappedRequiredCount(field);
                    
                    return (
                      <div key={field} className="border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                          <div className="flex items-center gap-2">
                            <Label className="font-medium">
                              {label}
                              {required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                          </div>
                          <Select
                            value={columnMappings.find(m => m.dbColumn === field)?.csvColumn || ''}
                            onValueChange={(value) => handleMappingChange(field, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select CSV column" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__skip__">Skip this field</SelectItem>
                              {csvHeaders.map(header => (
                                <SelectItem key={header} value={header}>{header}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Default Value Selector for Choice Fields */}
                        {hasChoices && module === 'leads' && (
                          <div className="border-t pt-3 space-y-2">
                            <Label className="text-sm text-muted-foreground">
                              Default Value {!isMapped && '(Required - field not mapped)'}
                            </Label>
                            {field === 'status' && (
                              <Select
                                value={getFieldDefaultValue('status')}
                                onValueChange={(value) => handleDefaultValueChange('status', value)}
                              >
                                <SelectTrigger className="bg-muted">
                                  <SelectValue placeholder="Select default status" />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            {field === 'service_needed' && (
                              <Select
                                value={getFieldDefaultValue('service_needed')}
                                onValueChange={(value) => handleDefaultValueChange('service_needed', value)}
                              >
                                <SelectTrigger className="bg-muted">
                                  <SelectValue placeholder="Select default service" />
                                </SelectTrigger>
                                <SelectContent>
                                  {services.length > 0 ? (
                                    services.map(service => (
                                      <SelectItem key={service.id} value={service.name}>
                                        {service.name}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value="General Service">General Service</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            )}
                            {!isMapped && unmappedCount > 0 && (
                              <div className="flex items-center gap-2 text-sm text-amber-600">
                                <AlertTriangle className="h-4 w-4" />
                                <span>{unmappedCount} records will use default value</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Import Options</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="skip-duplicates"
                      checked={skipDuplicates}
                      onCheckedChange={(checked) => setSkipDuplicates(checked as boolean)}
                    />
                    <label htmlFor="skip-duplicates" className="text-sm">
                      Skip duplicate entries (by email)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="update-existing"
                      checked={updateExisting}
                      onCheckedChange={(checked) => setUpdateExisting(checked as boolean)}
                    />
                    <label htmlFor="update-existing" className="text-sm">
                      Update existing records if found
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={resetImport}>Cancel</Button>
                <Button onClick={() => setStep('preview')}>Next: Preview</Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Preview & Import */}
        {step === 'preview' && (
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Preview Data</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Showing first 5 rows with your column mappings applied
                </p>
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columnMappings.map(({ dbColumn }) => (
                          <TableHead key={dbColumn}>
                            {moduleFields[module].find(f => f.field === dbColumn)?.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.slice(0, 5).map((row, idx) => (
                        <TableRow key={idx}>
                          {columnMappings.map(({ csvColumn, dbColumn }) => (
                            <TableCell key={dbColumn}>{row[csvColumn] || '—'}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {importing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importing...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} />
                </div>
              )}

              {importResult && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Import Results</h4>
                    {importResult.failed === 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <p className="text-lg font-semibold">{importResult.successful + importResult.failed}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Successful:</span>
                      <p className="text-lg font-semibold text-green-600">{importResult.successful}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Failed:</span>
                      <p className="text-lg font-semibold text-red-600">{importResult.failed}</p>
                    </div>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-medium mb-2 text-sm">Errors:</h5>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {importResult.errors.slice(0, 10).map((err: any, idx: number) => (
                          <p key={idx} className="text-xs text-red-600">
                            Row {err.row}: {err.error}
                          </p>
                        ))}
                        {importResult.errors.length > 10 && (
                          <p className="text-xs text-muted-foreground">
                            ... and {importResult.errors.length - 10} more errors
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setStep('mapping')}>Back</Button>
                {!importResult ? (
                  <Button onClick={handleImport} disabled={importing}>
                    {importing ? 'Importing...' : `Import ${csvData.length} Records`}
                  </Button>
                ) : (
                  <Button onClick={resetImport}>Import Another File</Button>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
  );
};

export default Import;
