import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { LeadAdvancedFilters } from '@/components/admin/leads/LeadAdvancedFilters';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { FilterChips } from '@/components/filters/FilterChips';
import { SavedViewsBar } from '@/components/filters/SavedViewsBar';
import { useUrlFilters } from '@/hooks/useUrlFilters';
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
  AlertCircle,
  Download
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CRUDLogger } from '@/lib/crudLogger';
import { ExportButton } from '@/components/admin/ExportButton';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { BulkActionsBar, BulkAction } from '@/components/admin/bulk/BulkActionsBar';
import { BulkOperationModal } from '@/components/admin/bulk/BulkOperationModal';
import { BulkDeleteConfirmation } from '@/components/admin/bulk/BulkDeleteConfirmation';
import { BulkProgressModal } from '@/components/admin/bulk/BulkProgressModal';
import { BulkOperationsService } from '@/services/bulkOperationsService';
import { UserCheck, FileDown, Tags, Users } from 'lucide-react';
import { BulkTagsModal } from '@/components/admin/bulk/BulkTagsModal';
import { BulkConvertLeadsModal } from '@/components/admin/bulk/BulkConvertLeadsModal';
import { useBulkUndo } from '@/hooks/useBulkUndo';
import { BulkUndoToast } from '@/components/admin/bulk/BulkUndoToast';
import { useUserRole } from '@/hooks/useUserRole';

const Leads = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { filters, setFilters, updateFilter, clearFilters } = useUrlFilters();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [convertingLead, setConvertingLead] = useState<any>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [services, setServices] = useState<string[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  // Bulk operations state
  const bulkSelection = useBulkSelection(leads);
  const [bulkOperationModal, setBulkOperationModal] = useState<{
    open: boolean;
    type: 'status' | 'assign' | null;
  }>({ open: false, type: null });
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkTagsOpen, setBulkTagsOpen] = useState(false);
  const [bulkConvertOpen, setBulkConvertOpen] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{
    open: boolean;
    operation: string;
    total: number;
    completed: number;
    failed: number;
    errors: Array<{ id: string; error: string }>;
    isComplete: boolean;
  }>({ open: false, operation: '', total: 0, completed: 0, failed: 0, errors: [], isComplete: false });
  
  const { role: userRole } = useUserRole();
  const { undoState, saveUndoState, performUndo, clearUndo } = useBulkUndo();

  useEffect(() => {
    loadLeads();
    loadUsers();
  }, [filters]);

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
  }, [leads, bulkSelection.selectedCount]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      let query = supabase.from('leads').select('*');

      // Apply advanced filters
      if (filters.status?.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.source) {
        query = query.eq('source', filters.source);
      }
      if (filters.assignedTo) {
        if (filters.assignedTo === 'unassigned') {
          query = query.is('assigned_to', null);
        } else {
          query = query.eq('assigned_to', filters.assignedTo);
        }
      }
      if (filters.createdFrom) {
        query = query.gte('created_at', new Date(filters.createdFrom).toISOString());
      }
      if (filters.createdTo) {
        query = query.lte('created_at', new Date(filters.createdTo).toISOString());
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
    const leadToDelete = leads.find(l => l.id === id);
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Log before deletion
      if (leadToDelete) {
        await CRUDLogger.logDelete({
          userId: user.id,
          entityType: 'lead',
          entityId: id,
          entityName: `${leadToDelete.first_name} ${leadToDelete.last_name}`
        });
      }

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

  // Bulk operations handlers
  const handleBulkAction = (actionId: string) => {
    switch (actionId) {
      case 'status':
        setBulkOperationModal({ open: true, type: 'status' });
        break;
      case 'assign':
        setBulkOperationModal({ open: true, type: 'assign' });
        break;
      case 'tags':
        setBulkTagsOpen(true);
        break;
      case 'convert':
        setBulkConvertOpen(true);
        break;
      case 'delete':
        setBulkDeleteOpen(true);
        break;
      case 'export':
        handleBulkExport();
        break;
    }
  };

  const handleBulkStatusChange = async (data: Record<string, any>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Save previous values for undo
    const previousValues = leads
      .filter(l => bulkSelection.selectedIds.has(l.id))
      .map(l => ({ id: l.id, status: l.status }));

    setBulkProgress({
      open: true,
      operation: 'Updating status',
      total: bulkSelection.selectedCount,
      completed: 0,
      failed: 0,
      errors: [],
      isComplete: false,
    });

    const result = await BulkOperationsService.bulkStatusChange(
      'leads',
      Array.from(bulkSelection.selectedIds),
      data.status,
      user.id
    );

    setBulkProgress(prev => ({
      ...prev,
      completed: result.success + result.failed,
      failed: result.failed,
      errors: result.errors,
      isComplete: true,
    }));

    // Save undo state
    saveUndoState({
      operation: 'status',
      module: 'leads',
      itemIds: Array.from(bulkSelection.selectedIds),
      previousValues,
      timestamp: new Date(),
    });

    bulkSelection.deselectAll();
    loadLeads();

    toast({
      title: 'Success',
      description: `Updated ${result.success} lead${result.success !== 1 ? 's' : ''}`,
    });
  };

  const handleBulkAssign = async (data: Record<string, any>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setBulkProgress({
      open: true,
      operation: 'Assigning leads',
      total: bulkSelection.selectedCount,
      completed: 0,
      failed: 0,
      errors: [],
      isComplete: false,
    });

    const result = await BulkOperationsService.bulkAssign(
      'leads',
      Array.from(bulkSelection.selectedIds),
      data.assignedTo,
      user.id
    );

    setBulkProgress(prev => ({
      ...prev,
      completed: result.success + result.failed,
      failed: result.failed,
      errors: result.errors,
      isComplete: true,
    }));

    bulkSelection.deselectAll();
    loadLeads();

    toast({
      title: 'Success',
      description: `Assigned ${result.success} lead${result.success !== 1 ? 's' : ''}`,
    });
  };

  const handleBulkDelete = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setBulkProgress({
      open: true,
      operation: 'Deleting leads',
      total: bulkSelection.selectedCount,
      completed: 0,
      failed: 0,
      errors: [],
      isComplete: false,
    });

    const result = await BulkOperationsService.bulkDelete(
      'leads',
      Array.from(bulkSelection.selectedIds),
      user.id
    );

    setBulkProgress(prev => ({
      ...prev,
      completed: result.success + result.failed,
      failed: result.failed,
      errors: result.errors,
      isComplete: true,
    }));

    bulkSelection.deselectAll();
    loadLeads();

    toast({
      title: 'Success',
      description: `Deleted ${result.success} lead${result.success !== 1 ? 's' : ''}`,
    });
  };

  const handleBulkExport = async () => {
    try {
      await BulkOperationsService.bulkExport(
        'leads',
        Array.from(bulkSelection.selectedIds)
      );
      toast({
        title: 'Success',
        description: `Exported ${bulkSelection.selectedCount} lead${bulkSelection.selectedCount !== 1 ? 's' : ''}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleBulkTags = async (tags: string[], mode: 'add' | 'replace') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await BulkOperationsService.bulkTagsUpdate('leads', Array.from(bulkSelection.selectedIds), tags, mode, user.id);
      toast({ title: 'Success', description: `Tags updated for ${bulkSelection.selectedCount} leads` });
      bulkSelection.deselectAll();
      loadLeads();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleBulkConvert = async (accountStatus: string, deleteLeads: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await BulkOperationsService.bulkConvertLeads(Array.from(bulkSelection.selectedIds), accountStatus, deleteLeads, user.id);
      toast({ title: 'Success', description: `Converted ${bulkSelection.selectedCount} leads to accounts` });
      bulkSelection.deselectAll();
      loadLeads();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Permission checks
  const canBulkEdit = userRole === 'admin' || leads.every(l => bulkSelection.selectedIds.has(l.id) ? l.assigned_to === users.find(u => u.id)?.id : true);
  const canBulkDelete = userRole === 'admin';

  const bulkActions: BulkAction[] = [
    {
      id: 'status',
      label: 'Change Status',
      icon: <CheckCircle className="h-4 w-4" />,
    },
    {
      id: 'assign',
      label: 'Assign to User',
      icon: <UserCheck className="h-4 w-4" />,
    },
    {
      id: 'tags',
      label: 'Manage Tags',
      icon: <Tags className="h-4 w-4" />,
    },
    {
      id: 'convert',
      label: 'Convert to Account',
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: 'export',
      label: 'Export Selected',
      icon: <FileDown className="h-4 w-4" />,
    },
    ...(canBulkDelete ? [{
      id: 'delete',
      label: 'Delete Selected',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive' as const,
    }] : []),
  ];


  const activeFilterCount = Object.keys(filters).filter(
    (key) => filters[key] !== null && filters[key] !== undefined && filters[key] !== ''
  ).length;

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Saved Views */}
        <SavedViewsBar
          module="leads"
          currentFilters={filters}
          onViewSelect={(viewFilters) => setFilters(viewFilters)}
        />

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold">Leads</h1>
            <p className="text-muted-foreground mt-1">
              Manage incoming leads and convert them to accounts
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setFilterPanelOpen(true)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            <ExportButton
              data={leads}
              moduleName="leads"
              columns={[
                'id', 'status', 'first_name', 'last_name', 'email', 'phone',
                'service_needed', 'street_address', 'city', 'state', 'zip',
                'is_emergency', 'created_at'
              ]}
              filters={filters}
              isFiltered={activeFilterCount > 0}
              filteredCount={leads.length}
            />
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Lead
            </Button>
          </div>
        </div>

        {/* Filter Chips */}
        <FilterChips
          filters={filters}
          onRemove={(key) => updateFilter(key, null)}
          onClearAll={clearFilters}
        />

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
                      <TableHead className="w-12">
                        <Checkbox
                          checked={bulkSelection.isAllSelected}
                          onCheckedChange={() => bulkSelection.toggleAll(leads)}
                        />
                      </TableHead>
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
                        <TableCell colSpan={8} className="text-center py-8">
                          Loading leads...
                        </TableCell>
                      </TableRow>
                    ) : leads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No leads found
                        </TableCell>
                      </TableRow>
                    ) : (
                      leads.map((lead) => (
                        <TableRow key={lead.id} className="group">
                          <TableCell>
                            <Checkbox
                              checked={bulkSelection.isSelected(lead.id)}
                              onCheckedChange={() => bulkSelection.toggleItem(lead.id)}
                            />
                          </TableCell>
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

      {/* Advanced Filter Panel */}
      <FilterPanel
        open={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        title="Filter Leads"
        onClearAll={clearFilters}
      >
        <LeadAdvancedFilters
          values={filters}
          onChange={updateFilter}
          users={users}
        />
      </FilterPanel>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={bulkSelection.selectedCount}
        actions={bulkActions}
        onAction={handleBulkAction}
        onClear={bulkSelection.deselectAll}
      />

      {/* Bulk Status Change Modal */}
      <BulkOperationModal
        open={bulkOperationModal.open && bulkOperationModal.type === 'status'}
        onOpenChange={(open) => !open && setBulkOperationModal({ open: false, type: null })}
        title="Change Status"
        description="Update the status for selected leads"
        selectedCount={bulkSelection.selectedCount}
        onConfirm={handleBulkStatusChange}
        fields={[
          {
            name: 'status',
            label: 'New Status',
            type: 'select',
            required: true,
            options: [
              { value: 'new', label: 'New' },
              { value: 'contacted', label: 'Contacted' },
              { value: 'qualified', label: 'Qualified' },
              { value: 'converted', label: 'Converted' },
              { value: 'lost', label: 'Lost' },
            ],
          },
        ]}
      />

      {/* Bulk Assign Modal */}
      <BulkOperationModal
        open={bulkOperationModal.open && bulkOperationModal.type === 'assign'}
        onOpenChange={(open) => !open && setBulkOperationModal({ open: false, type: null })}
        title="Assign Leads"
        description="Assign selected leads to a user"
        selectedCount={bulkSelection.selectedCount}
        onConfirm={handleBulkAssign}
        fields={[
          {
            name: 'assignedTo',
            label: 'Assign To',
            type: 'select',
            required: true,
            options: users.map(u => ({ value: u.id, label: u.name })),
          },
        ]}
      />

      {/* Bulk Delete Confirmation */}
      <BulkDeleteConfirmation
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        itemCount={bulkSelection.selectedCount}
        itemType="leads"
        itemNames={bulkSelection.selectedItems.map(l => `${l.first_name} ${l.last_name}`)}
        onConfirm={handleBulkDelete}
      />

      {/* Bulk Progress Modal */}
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

      {/* Bulk Tags Modal */}
      <BulkTagsModal
        open={bulkTagsOpen}
        onOpenChange={setBulkTagsOpen}
        selectedCount={bulkSelection.selectedCount}
        module="leads"
        onConfirm={handleBulkTags}
      />

      {/* Bulk Convert Modal */}
      <BulkConvertLeadsModal
        open={bulkConvertOpen}
        onOpenChange={setBulkConvertOpen}
        selectedCount={bulkSelection.selectedCount}
        onConfirm={handleBulkConvert}
      />

      {/* Undo Toast */}
      {undoState && (
        <BulkUndoToast
          count={undoState.itemIds.length}
          onUndo={async () => {
            await performUndo();
            loadLeads();
          }}
        />
      )}
    </AdminLayout>
  );
};

export default Leads;