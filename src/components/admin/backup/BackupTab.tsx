import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { backupService, BackupOptions } from '@/services/backupService';
import { Loader2, Download, Trash2, Database, HardDrive, FileText } from 'lucide-react';
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      toast({
        title: 'Backup created successfully',
        description: 'Your backup file has been downloaded.',
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
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !backups || backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No backups yet. Create your first backup above.
            </div>
          ) : (
            <div className="space-y-4">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
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
