import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { LeadStatusBadge } from '@/components/admin/leads/LeadStatusBadge';
import { LeadFilters } from '@/components/admin/leads/LeadFilters';
import { LeadForm } from '@/components/admin/leads/LeadForm';
import { LeadConvert } from '@/components/admin/leads/LeadConvert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  MoreVertical, 
  Phone, 
  Mail, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Filter,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Leads = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [convertingLead, setConvertingLead] = useState<any>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [services, setServices] = useState<string[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [filters, setFilters] = useState<any>({});

  useEffect(() => {
    loadLeads();
    loadUsers();
  }, [filters]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      let query = supabase.from('leads').select('*');

      // Apply filters
      if (filters.statuses?.length > 0) {
        query = query.in('status', filters.statuses);
      }
      if (filters.service && filters.service !== 'all') {
        query = query.eq('service_needed', filters.service);
      }
      if (filters.assignedTo && filters.assignedTo !== 'all') {
        if (filters.assignedTo === 'unassigned') {
          query = query.is('assigned_to', null);
        } else {
          query = query.eq('assigned_to', filters.assignedTo);
        }
      }
      if (filters.emergencyOnly) {
        query = query.eq('is_emergency', true);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo.toISOString());
      }
      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setLeads(data || []);

      // Calculate status counts
      const counts: Record<string, number> = {
        new: 0,
        contacted: 0,
        qualified: 0,
        converted: 0,
        lost: 0
      };
      data?.forEach(lead => {
        if (counts[lead.status] !== undefined) {
          counts[lead.status]++;
        }
      });
      setStatusCounts(counts);

      // Get unique services
      const uniqueServices = [...new Set(data?.map(lead => lead.service_needed).filter(Boolean))];
      setServices(uniqueServices as string[]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'crm_user']);

      if (error) throw error;

      // For now, create placeholder user data - in a real app, you'd fetch from a users table
      const userList = data?.map((ur, idx) => ({
        id: ur.user_id,
        name: `User ${idx + 1}`
      })) || [];

      setUsers(userList);
    } catch (error: any) {
      console.error('Error loading users:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Lead deleted successfully'
      });

      loadLeads();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '';
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length !== 10) return phone;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold">Leads</h1>
            <p className="text-muted-foreground mt-1">
              Manage incoming leads and convert them to accounts
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Lead
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {Object.entries(statusCounts).map(([status, count]) => (
            <Card key={status} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground capitalize">{status}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
                <LeadStatusBadge status={status} />
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filters</h3>
                <Sheet>
                  <SheetTrigger asChild className="lg:hidden">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                      <LeadFilters
                        onFiltersChange={setFilters}
                        statusCounts={statusCounts}
                        services={services}
                        users={users}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              <div className="hidden lg:block">
                <LeadFilters
                  onFiltersChange={setFilters}
                  statusCounts={statusCounts}
                  services={services}
                  users={users}
                />
              </div>
            </Card>
          </div>

          {/* Leads Table */}
          <div className="lg:col-span-3">
            <Card>
              <div className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading leads...
                        </TableCell>
                      </TableRow>
                    ) : leads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No leads found
                        </TableCell>
                      </TableRow>
                    ) : (
                      leads.map((lead) => (
                        <TableRow key={lead.id} className="group">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <LeadStatusBadge status={lead.status} />
                              {lead.is_emergency && (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
                              className="font-medium hover:underline text-left"
                            >
                              {lead.first_name} {lead.last_name}
                            </button>
                          </TableCell>
                          <TableCell>{lead.service_needed}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <a
                                href={`mailto:${lead.email}`}
                                className="text-sm hover:underline flex items-center gap-1"
                              >
                                <Mail className="h-3 w-3" />
                                {lead.email}
                              </a>
                              <a
                                href={`tel:${lead.phone}`}
                                className="text-sm hover:underline flex items-center gap-1"
                              >
                                <Phone className="h-3 w-3" />
                                {formatPhone(lead.phone)}
                              </a>
                            </div>
                          </TableCell>
                          <TableCell>
                            {lead.city}, {lead.state}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/dashboard/leads/${lead.id}`)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditingLead(lead)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                {lead.status !== 'converted' && (
                                  <DropdownMenuItem onClick={() => setConvertingLead(lead)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Convert to Account
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleDelete(lead.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingLead) && (
        <LeadForm
          isOpen={true}
          onClose={() => {
            setShowCreateForm(false);
            setEditingLead(null);
          }}
          onSuccess={() => {
            loadLeads();
            setShowCreateForm(false);
            setEditingLead(null);
          }}
          lead={editingLead}
          users={users}
        />
      )}

      {/* Convert Modal */}
      {convertingLead && (
        <LeadConvert
          isOpen={true}
          onClose={() => setConvertingLead(null)}
          lead={convertingLead}
        />
      )}
    </AdminLayout>
  );
};

export default Leads;