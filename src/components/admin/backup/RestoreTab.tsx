import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { restoreService, BackupFile, RestoreOptions } from '@/services/restoreService';
import { Loader2, Upload, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const RestoreTab = () => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupData, setBackupData] = useState<BackupFile | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('merge');
  const [isRestoring, setIsRestoring] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    try {
      const backup = await restoreService.parseBackupFile(file);
      setBackupData(backup);
      toast({ title: 'Backup file loaded successfully' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Invalid backup file',
        description: error.message,
      });
      setSelectedFile(null);
      setBackupData(null);
    }
  };

  const handleRestore = async () => {
    if (!backupData) return;

    setIsRestoring(true);
    try {
      const options: RestoreOptions = {
        mode: restoreMode,
      };

      await restoreService.restoreFromBackup(backupData, options);

      toast({
        title: 'Restore completed successfully',
        description: 'Your data has been restored.',
      });

      // Reset state
      setSelectedFile(null);
      setBackupData(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Restore failed',
        description: error.message,
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Backup File</CardTitle>
          <CardDescription>
            Select a backup file to restore your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              id="backup-file"
            />
            <Label htmlFor="backup-file" className="cursor-pointer">
              <Button variant="outline" asChild>
                <span>Browse Files</span>
              </Button>
            </Label>
            {selectedFile && (
              <div className="mt-4 text-sm text-muted-foreground">
                Selected: {selectedFile.name}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {backupData && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Backup Contents</CardTitle>
              <CardDescription>
                Created: {new Date(backupData.timestamp).toLocaleString()} • Type:{' '}
                {backupData.type}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {restoreService.getBackupSummary(backupData).map((item) => (
                  <div key={item.table} className="p-3 border rounded-lg">
                    <div className="text-sm font-medium">{item.table}</div>
                    <div className="text-2xl font-bold">{item.count}</div>
                    <div className="text-xs text-muted-foreground">records</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Restore Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={restoreMode} onValueChange={(v: any) => setRestoreMode(v)}>
                <div className="flex items-start space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="merge" id="merge" />
                  <div className="flex-1">
                    <Label htmlFor="merge" className="font-medium">
                      Merge (Recommended)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Keep existing data and add records from backup. Existing records with
                      same ID will be updated.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="replace" id="replace" />
                  <div className="flex-1">
                    <Label htmlFor="replace" className="font-medium">
                      Full Replace
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Delete all existing data and restore from backup only. Use with caution!
                    </p>
                  </div>
                </div>
              </RadioGroup>

              {restoreMode === 'replace' && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Warning: Full replace will permanently delete all your current data. This
                    action cannot be undone.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleRestore}
                disabled={isRestoring}
                className="w-full"
                size="lg"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  'Restore Now'
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default RestoreTab;
