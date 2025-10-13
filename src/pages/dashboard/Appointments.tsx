import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Check, X, Calendar, Clock, Download, UserCheck, FileDown } from 'lucide-react';
import { ExportService } from '@/services/exportService';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { BulkActionsBar, BulkAction } from '@/components/admin/bulk/BulkActionsBar';
import { BulkOperationModal } from '@/components/admin/bulk/BulkOperationModal';
import { BulkDeleteConfirmation } from '@/components/admin/bulk/BulkDeleteConfirmation';
import { BulkProgressModal } from '@/components/admin/bulk/BulkProgressModal';
import { BulkOperationsService } from '@/services/bulkOperationsService';
import { useBulkUndo } from '@/hooks/useBulkUndo';
import { BulkUndoToast } from '@/components/admin/bulk/BulkUndoToast';
import { useUserRole } from '@/hooks/useUserRole';

interface Appointment {
  id: string;
  title: string;
  description: string;
  appointment_type: 'onsite' | 'virtual' | 'phone';
  status: 'scheduled' | 'completed' | 'canceled' | 'requested';
  start_time: string;
  end_time: string;
  location: string | null;
  notes: string | null;
  account_id: string;
  accounts?: {
    account_name: string;
  };
}

const Appointments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');

  // Bulk operations state
  const bulkSelection = useBulkSelection(appointments);
  const [bulkOperationModal, setBulkOperationModal] = useState<{
    open: boolean;
    type: 'type' | 'reschedule' | null;
  }>({ open: false, type: null });
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{
    open: boolean;
    operation: string;
    total: number;
    completed: number;
    failed: number;
    errors: Array<{ id: string; error: string }>;
    isComplete: boolean;
  }>({ open: false, operation: '', total: 0, completed: 0, failed: 0, errors: [], isComplete: false });
  
  const { role } = useUserRole();
  const { undoState, saveUndoState, performUndo } = useBulkUndo();

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('calendar_events')
        .select(`
          *,
          accounts (
            account_name
          )
        `)
        .order('start_time', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'scheduled' | 'completed' | 'canceled' | 'requested');
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({ status: 'scheduled' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Appointment approved');
      fetchAppointments();
    } catch (error) {
      console.error('Error approving appointment:', error);
      toast.error('Failed to approve appointment');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({ status: 'canceled' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Appointment rejected');
      fetchAppointments();
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      toast.error('Failed to reject appointment');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      requested: 'outline',
      scheduled: 'default',
      completed: 'secondary',
      canceled: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      onsite: 'bg-blue-100 text-blue-800',
      virtual: 'bg-green-100 text-green-800',
      phone: 'bg-purple-100 text-purple-800',
    };

    return (
      <Badge className={colors[type] || ''}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  // Bulk operations handlers
  const bulkActions: BulkAction[] = [
    { id: 'type', label: 'Change Type' },
    { id: 'reschedule', label: 'Reschedule (offset days)' },
    { id: 'export', label: 'Export Selected', icon: <FileDown className="h-4 w-4" /> },
    { id: 'delete', label: 'Delete Selected', variant: 'destructive' as const },
  ];

  const handleBulkAction = (actionId: string) => {
    switch (actionId) {
      case 'type':
      case 'reschedule':
        setBulkOperationModal({ open: true, type: actionId as any });
        break;
      case 'delete':
        setBulkDeleteOpen(true);
        break;
      case 'export':
        handleBulkExport();
        break;
    }
  };

  const handleBulkOperationConfirm = async (formData: Record<string, any>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Store previous values for undo
    const previousValues = bulkSelection.selectedItems.map(a => ({
      id: a.id,
      ...(bulkOperationModal.type === 'type' && { appointment_type: a.appointment_type }),
      ...(bulkOperationModal.type === 'reschedule' && { start_time: a.start_time, end_time: a.end_time }),
    }));

    setBulkProgress({
      open: true,
      operation: `Updating ${bulkSelection.selectedCount} appointments`,
      total: bulkSelection.selectedCount,
      completed: 0,
      failed: 0,
      errors: [],
      isComplete: false,
    });

    let changes: Record<string, any> = {};
    if (bulkOperationModal.type === 'type') {
      changes = { appointment_type: formData.appointment_type };
    } else if (bulkOperationModal.type === 'reschedule') {
      // Offset appointments by X days - will need to fetch and update each individually
      const offsetDays = parseInt(formData.offset_days || '0');
      for (const appointment of bulkSelection.selectedItems) {
        const startTime = new Date(appointment.start_time);
        const endTime = new Date(appointment.end_time);
        startTime.setDate(startTime.getDate() + offsetDays);
        endTime.setDate(endTime.getDate() + offsetDays);
        
        await supabase
          .from('calendar_events')
          .update({
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
          })
          .eq('id', appointment.id);
      }
    }

    if (bulkOperationModal.type === 'type') {
      const result = await BulkOperationsService.performBulkOperation({
        type: 'status_change',
        itemIds: Array.from(bulkSelection.selectedIds),
        module: 'calendar_events',
        changes,
        userId: user.id,
      });
      
      if (result.success > 0) {
        saveUndoState({
          operation: 'edit',
          module: 'calendar_events',
          itemIds: Array.from(bulkSelection.selectedIds),
          previousValues,
          timestamp: new Date(),
        });
      }
      
      setBulkProgress(prev => ({ ...prev, ...result, isComplete: true }));
    } else {
      saveUndoState({
        operation: 'edit',
        module: 'calendar_events',
        itemIds: Array.from(bulkSelection.selectedIds),
        previousValues,
        timestamp: new Date(),
      });
      setBulkProgress(prev => ({ ...prev, completed: bulkSelection.selectedCount, isComplete: true }));
    }

    bulkSelection.deselectAll();
    fetchAppointments();
    
    toast.success(`${bulkSelection.selectedCount} appointments updated`);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.shiftKey) {
        e.preventDefault();
        bulkSelection.selectAll();
      }
      if (e.key === 'Escape' && bulkSelection.selectedCount > 0) {
        bulkSelection.deselectAll();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bulkSelection.selectedCount]);

  // Permission controls
  const canBulkEdit = role === 'Super Admin' || role === 'Admin';
  const canBulkDelete = role === 'Super Admin' || role === 'Admin';

  const handleBulkDelete = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setBulkProgress({
      open: true,
      operation: `Deleting ${bulkSelection.selectedCount} appointments`,
      total: bulkSelection.selectedCount,
      completed: 0,
      failed: 0,
      errors: [],
      isComplete: false,
    });

    const result = await BulkOperationsService.bulkDelete('calendar_events', Array.from(bulkSelection.selectedIds), user.id);

    setBulkProgress(prev => ({ ...prev, ...result, isComplete: true }));
    bulkSelection.deselectAll();
    fetchAppointments();

    toast.success(`${result.success} appointments deleted`);
  };

  const handleBulkExport = async () => {
    try {
      await BulkOperationsService.bulkExport('calendar_events', Array.from(bulkSelection.selectedIds));
      toast.success(`${bulkSelection.selectedCount} appointments exported`);
    } catch (error) {
      toast.error('Failed to export appointments');
    }
  };

  const getBulkModalTitle = () => {
    switch (bulkOperationModal.type) {
      case 'type': return 'Change Appointment Type';
      case 'reschedule': return 'Reschedule Appointments';
      default: return '';
    }
  };

  const getBulkModalDescription = () => {
    return `Update ${bulkSelection.selectedCount} selected appointments`;
  };

  const getBulkModalFields = () => {
    switch (bulkOperationModal.type) {
      case 'type':
        return [{
          name: 'appointment_type',
          label: 'Appointment Type',
          type: 'select' as const,
          options: [
            { value: 'onsite', label: 'Onsite' },
            { value: 'virtual', label: 'Virtual' },
            { value: 'phone', label: 'Phone' },
          ],
          required: true,
        }];
      case 'reschedule':
        return [{
          name: 'offset_days',
          label: 'Offset by days',
          type: 'text' as const,
          required: true,
        }];
      default:
        return [];
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Appointments Management</CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="requested">Requested</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No appointments found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={bulkSelection.isAllSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            bulkSelection.selectAll();
                          } else {
                            bulkSelection.deselectAll();
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow 
                      key={appointment.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/dashboard/appointments/${appointment.id}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={bulkSelection.isSelected(appointment.id)}
                          onCheckedChange={() => bulkSelection.toggleItem(appointment.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {appointment.accounts?.account_name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{appointment.title}</div>
                          {appointment.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {appointment.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(appointment.appointment_type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(appointment.start_time), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {format(new Date(appointment.start_time), 'h:mm a')}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                      <TableCell>
                        {appointment.status === 'requested' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(appointment.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(appointment.id)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Bulk Operations UI */}
        <BulkActionsBar
          selectedCount={bulkSelection.selectedCount}
          actions={bulkActions}
          onAction={handleBulkAction}
          onClear={bulkSelection.deselectAll}
        />

        <BulkOperationModal
          open={bulkOperationModal.open}
          onOpenChange={(open) => setBulkOperationModal({ open, type: null })}
          title={getBulkModalTitle()}
          description={getBulkModalDescription()}
          selectedCount={bulkSelection.selectedCount}
          onConfirm={handleBulkOperationConfirm}
          fields={getBulkModalFields()}
        />

        <BulkDeleteConfirmation
          open={bulkDeleteOpen}
          onOpenChange={setBulkDeleteOpen}
          itemCount={bulkSelection.selectedCount}
          itemType="appointments"
          onConfirm={handleBulkDelete}
          requireTyping={bulkSelection.selectedCount > 10}
        />

        <BulkProgressModal
          open={bulkProgress.open}
          onOpenChange={(open) => setBulkProgress(prev => ({ ...prev, open }))}
          operation={bulkProgress.operation}
          total={bulkProgress.total}
          completed={bulkProgress.completed}
          failed={bulkProgress.failed}
          errors={bulkProgress.errors}
          isComplete={bulkProgress.isComplete}
        />

        {undoState && (
          <BulkUndoToast count={undoState.itemIds.length} onUndo={performUndo} />
        )}
      </div>
    </AdminLayout>
  );
};

export default Appointments;
