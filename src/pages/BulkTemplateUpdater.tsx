import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Loader2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunction } from '@/utils/callEdgeFunction';

interface TemplateFile {
  fileName: string;
  type: 'service' | 'static';
}

const TEMPLATE_FILES: TemplateFile[] = [
  // Authority Hub Templates
  { fileName: 'emergency-roof-repair.html', type: 'service' },
  { fileName: 'general-contracting.html', type: 'service' },
  { fileName: 'insurance-claims-assistance.html', type: 'service' },
  { fileName: 'residential-roofing.html', type: 'service' },
  { fileName: 'storm-damage-restoration.html', type: 'service' },
  { fileName: 'hail-damage-repair.html', type: 'service' },
  { fileName: 'leak-detection-repair.html', type: 'service' },
  { fileName: 'wind-damage-restoration.html', type: 'service' },
  // Granular Service Templates
  { fileName: 'asphalt-shingle-roofing-3.html', type: 'service' },
  { fileName: 'attic-ventilation.html', type: 'service' },
  { fileName: 'chimney-repair.html', type: 'service' },
  { fileName: 'flat-roof-systems.html', type: 'service' },
  { fileName: 'green-roof-systems.html', type: 'service' },
  { fileName: 'gutter-installation.html', type: 'service' },
  { fileName: 'hurricane-preparation.html', type: 'service' },
  { fileName: 'metal-roofing.html', type: 'service' },
  { fileName: 'pressure-washing.html', type: 'service' },
  { fileName: 'roof-coatings.html', type: 'service' },
  { fileName: 'roof-inspection.html', type: 'service' },
  { fileName: 'routine-maintenance.html', type: 'service' },
  { fileName: 'siding-installation.html', type: 'service' },
  { fileName: 'skylight-installation.html', type: 'service' },
  { fileName: 'slate-roofing.html', type: 'service' },
  { fileName: 'solar-roofing.html', type: 'service' },
  { fileName: 'tile-roofing.html', type: 'service' },
  { fileName: 'waterproofing-services.html', type: 'service' },
  { fileName: 'window-installation.html', type: 'service' },
  // Static Pages
  { fileName: 'about.html', type: 'static' },
  { fileName: 'contact.html', type: 'static' },
  { fileName: 'home.html', type: 'static' },
  { fileName: 'services.html', type: 'static' },
];

export default function BulkTemplateUpdater() {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [currentFile, setCurrentFile] = useState('');

  const readFileContent = async (fileName: string): Promise<string> => {
    // Read from public/temp-templates/ folder
    const filePath = `/temp-templates/${fileName}`;
    
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to read ${fileName}`);
      }
      return await response.text();
    } catch (error) {
      console.error(`Error reading ${fileName}:`, error);
      throw error;
    }
  };

  const handleBulkUpdate = async () => {
    setProcessing(true);
    setProgress(0);
    setResults([]);

    const templates = [];
    const totalFiles = TEMPLATE_FILES.length;

    // Read all files first
    for (let i = 0; i < TEMPLATE_FILES.length; i++) {
      const file = TEMPLATE_FILES[i];
      setCurrentFile(`Reading ${file.fileName}...`);
      setProgress(((i + 1) / totalFiles) * 50); // First 50% for reading

      try {
        const content = await readFileContent(file.fileName);
        templates.push({
          fileName: file.fileName,
          htmlContent: content,
          type: file.type
        });
      } catch (error) {
        console.error(`Failed to read ${file.fileName}:`, error);
        setResults(prev => [...prev, {
          fileName: file.fileName,
          success: false,
          error: 'Failed to read file'
        }]);
      }
    }

    // Process in batches of 5 to avoid overwhelming the edge function
    const batchSize = 5;
    for (let i = 0; i < templates.length; i += batchSize) {
      const batch = templates.slice(i, i + batchSize);
      setCurrentFile(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(templates.length / batchSize)}...`);

      try {
        const data = await callEdgeFunction<any>({
          name: 'bulk-update-templates',
          body: { templates: batch },
          timeoutMs: 300000,
        });

        if (data?.results) {
          setResults(prev => [...prev, ...data.results]);
        }
      } catch (error) {
        console.error('Batch processing error:', error);
        batch.forEach(t => {
          setResults(prev => [...prev, {
            fileName: t.fileName,
            success: false,
            error: 'Batch processing failed'
          }]);
        });
      }

      setProgress(50 + ((i + batchSize) / templates.length) * 50);
    }

    setProcessing(false);
    setCurrentFile('Complete!');
    setProgress(100);
  };

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Bulk Template Updater
          </CardTitle>
          <CardDescription>
            Process and update all 31 service templates and static pages from uploaded HTML files.
            This will strip headers/footers and update the database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Total Templates:</span>
              <span>{TEMPLATE_FILES.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">Service Templates:</span>
              <span>{TEMPLATE_FILES.filter(f => f.type === 'service').length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">Static Pages:</span>
              <span>{TEMPLATE_FILES.filter(f => f.type === 'static').length}</span>
            </div>
          </div>

          {!processing && results.length === 0 && (
            <Button 
              onClick={handleBulkUpdate} 
              size="lg" 
              className="w-full"
            >
              <Upload className="mr-2 h-5 w-5" />
              Start Bulk Update
            </Button>
          )}

          {processing && (
            <div className="space-y-3">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{currentFile}</span>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-50 dark:bg-green-950">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {successCount}
                      </span>
                      <span className="text-sm text-green-600 dark:text-green-400">Successful</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-red-50 dark:bg-red-950">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {failCount}
                      </span>
                      <span className="text-sm text-red-600 dark:text-red-400">Failed</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                <h3 className="font-semibold text-sm text-muted-foreground">Results:</h3>
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 p-2 rounded text-sm ${
                      result.success
                        ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300'
                        : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span className="font-medium">{result.fileName}</span>
                    {result.serviceName && (
                      <span className="text-xs">→ {result.serviceName}</span>
                    )}
                    {result.slug && (
                      <span className="text-xs">→ {result.slug}</span>
                    )}
                    {result.error && (
                      <span className="text-xs ml-auto">{result.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
