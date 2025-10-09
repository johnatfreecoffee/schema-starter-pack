import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Eye, Trash2, FileText, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const ImportHistory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [imports, setImports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImport, setSelectedImport] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    fetchImportHistory();
  }, []);

  const fetchImportHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('import_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImports(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('import_history')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Import record deleted',
      });

      fetchImportHistory();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const viewDetails = (importRecord: any) => {
    setSelectedImport(importRecord);
    setShowDetailsDialog(true);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/import')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Import
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-4xl font-bold">Import History</h1>
          <p className="text-muted-foreground mt-1">
            View all past data imports and their results
          </p>
        </div>

        <Card>
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Total Rows</TableHead>
                  <TableHead>Success</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading import history...
                    </TableCell>
                  </TableRow>
                ) : imports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No import history found
                    </TableCell>
                  </TableRow>
                ) : (
                  imports.map((importRecord) => (
                    <TableRow key={importRecord.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">
                            {new Date(importRecord.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(importRecord.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {importRecord.module}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {importRecord.filename}
                        </div>
                      </TableCell>
                      <TableCell>{importRecord.total_rows}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          {importRecord.successful_rows}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-4 w-4" />
                          {importRecord.failed_rows}
                        </div>
                      </TableCell>
                      <TableCell>
                        {importRecord.failed_rows === 0 ? (
                          <Badge className="bg-green-500">Complete</Badge>
                        ) : importRecord.successful_rows > 0 ? (
                          <Badge variant="secondary">Partial</Badge>
                        ) : (
                          <Badge variant="destructive">Failed</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewDetails(importRecord)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Import Record</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this import record? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(importRecord.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Details</DialogTitle>
          </DialogHeader>
          {selectedImport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(selectedImport.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Module</p>
                  <p className="font-medium capitalize">{selectedImport.module}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">File Name</p>
                  <p className="font-medium">{selectedImport.filename}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Rows</p>
                  <p className="font-medium">{selectedImport.total_rows}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Successful</p>
                  <p className="font-medium text-green-600">{selectedImport.successful_rows}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="font-medium text-red-600">{selectedImport.failed_rows}</p>
                </div>
              </div>

              {selectedImport.error_log && selectedImport.error_log.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Error Log</h4>
                  <div className="bg-muted/50 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                      {selectedImport.error_log.map((error: any, idx: number) => (
                        <div key={idx} className="text-sm">
                          <span className="font-medium">Row {error.row}:</span>{' '}
                          <span className="text-red-600">{error.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedImport.settings && (
                <div>
                  <h4 className="font-semibold mb-2">Import Settings</h4>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(selectedImport.settings, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ImportHistory;
