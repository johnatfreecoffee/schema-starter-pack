import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Check, X, Calendar, Clock } from 'lucide-react';

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
      </div>
    </AdminLayout>
  );
};

export default Appointments;
