import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { backupService, BackupOptions } from '@/services/backupService';
import { Loader2, Trash2, Database, HardDrive, FileText, Clock, CheckCircle2, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const BackupTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteBackupId, setDeleteBackupId] = useState<string | null>(null);

  const { data: backups, isLoading } = useQuery({
    queryKey: ['backups'],
    queryFn: () => backupService.getBackupHistory(),
  });

  const createBackupMutation = useMutation({
    mutationFn: (options: BackupOptions) => backupService.createBackup(options),
    onSuccess: (metadata) => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      toast({
        title: 'Backup created successfully',
        description: `Backup created (${backupService.formatFileSize(metadata.file_size)}). ${metadata.tables_included.length} tables included.`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Backup failed',
        description: error.message,
      });
    },
  });

  const deleteBackupMutation = useMutation({
    mutationFn: (id: string) => backupService.deleteBackup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      toast({ title: 'Backup deleted successfully' });
      setDeleteBackupId(null);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: error.message,
      });
    },
  });

  const handleCreateBackup = (type: BackupOptions['type']) => {
    createBackupMutation.mutate({ type });
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Backups
                </p>
                <p className="text-2xl font-bold">
                  {backups?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Last Backup
                </p>
                <p className="text-2xl font-bold">
                  {backups?.[0] 
                    ? format(new Date(backups[0].created_at), 'MMM d, yyyy')
                    : 'Never'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <FileText className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Storage Used
                </p>
                <p className="text-2xl font-bold">
                  {backups 
                    ? backupService.formatFileSize(
                        backups.reduce((sum, b) => sum + (b.file_size || 0), 0)
                      )
                    : '0 B'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Backup</CardTitle>
          <CardDescription>
            Choose what data to backup. Backup files will be downloaded to your computer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => handleCreateBackup('full')}
              disabled={createBackupMutation.isPending}
              className="h-24 flex flex-col gap-2"
            >
              {createBackupMutation.isPending &&
              createBackupMutation.variables?.type === 'full' ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Database className="h-6 w-6" />
              )}
              <div className="text-center">
                <div className="font-semibold">Full Backup</div>
                <div className="text-xs opacity-80">All data & settings</div>
              </div>
            </Button>

            <Button
              onClick={() => handleCreateBackup('crm')}
              disabled={createBackupMutation.isPending}
              className="h-24 flex flex-col gap-2"
              variant="outline"
            >
              {createBackupMutation.isPending &&
              createBackupMutation.variables?.type === 'crm' ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <HardDrive className="h-6 w-6" />
              )}
              <div className="text-center">
                <div className="font-semibold">CRM Only</div>
                <div className="text-xs opacity-80">Leads, accounts, tasks</div>
              </div>
            </Button>

            <Button
              onClick={() => handleCreateBackup('pages')}
              disabled={createBackupMutation.isPending}
              className="h-24 flex flex-col gap-2"
              variant="outline"
            >
              {createBackupMutation.isPending &&
              createBackupMutation.variables?.type === 'pages' ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <FileText className="h-6 w-6" />
              )}
              <div className="text-center">
                <div className="font-semibold">Pages Only</div>
                <div className="text-xs opacity-80">Services, areas, pages</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>Recent backups (last 30 days)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !backups || backups.length === 0 ? (
            <div className="text-center py-12">
              <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No backups yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first backup to protect your data and enable disaster recovery
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="outline" className="capitalize">
                        {backup.backup_type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(backup.created_at).toLocaleString()}
                      </span>
                      <Badge
                        variant={
                          backup.status === 'success'
                            ? 'default'
                            : backup.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {backup.status}
                      </Badge>
                      {backup.restored_at && (
                        <Badge variant="outline" className="ml-2">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Restored {format(new Date(backup.restored_at), 'MMM d, yyyy')}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      {backup.file_size
                        ? backupService.formatFileSize(backup.file_size)
                        : 'N/A'}{' '}
                      • {backup.tables_included.length} tables
                    </div>
                    {backup.error_message && (
                      <div className="text-sm text-destructive mt-1">
                        Error: {backup.error_message}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteBackupId(backup.id)}
                      disabled={deleteBackupMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteBackupId} onOpenChange={() => setDeleteBackupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this backup? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteBackupId && deleteBackupMutation.mutate(deleteBackupId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BackupTab;
