import { useState, useEffect, useRef } from 'react';
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
import { ResponsiveList, MobileCard, MobileCardField } from '@/components/ui/responsive-table';
import { MobileActionButton } from '@/components/ui/mobile-action-button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation';
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
import { workflowService } from '@/services/workflowService';
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
import { BulkSelectAllBanner } from '@/components/admin/bulk/BulkSelectAllBanner';
import { BulkConfirmationModal } from '@/components/admin/bulk/BulkConfirmationModal';

const Leads = () => {
  // Track performance
  usePerformanceMonitor('Leads Page');
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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
  const [totalCount, setTotalCount] = useState(0);
  
  // Search with debouncing
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  // Bulk operations state
  const bulkSelection = useBulkSelection(leads);
  const hasLoadedOnce = useRef(false);
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
  
  const [confirmBulkAction, setConfirmBulkAction] = useState<{
    open: boolean;
    action: string;
    callback: () => void;
  } | null>(null);

  // Load leads when filters change
  useEffect(() => {
    loadLeads();
  }, [filters]);

  // Load users once (avoid repeated RPC + flicker)
  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // Avoid flicker: only show skeleton on first load
    if (!hasLoadedOnce.current) setLoading(true);

    let lastError: any = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        let query = supabase
          .from('leads')
          .select('*, service:services(id, name)');

        // Apply advanced filters
        if (filters.status?.length > 0) {
          query = query.in('status', filters.status);
        }
        if (filters.source) {
          query = query.eq('source', filters.source);
        }
        if (filters.serviceId) {
          query = query.eq('service_id', filters.serviceId);
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

        // Get total count
        const { count } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true });
        
        setTotalCount(count || 0);

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

        hasLoadedOnce.current = true;
        lastError = null;
        break; // success, exit retry loop
      } catch (error: any) {
        lastError = error;
        // Retry once for transient network errors
        const isNetwork = String(error?.message || error).includes('Failed to fetch');
        if (isNetwork && attempt === 0) {
          await new Promise(r => setTimeout(r, 400));
          continue;
        }
      }
    }

    if (lastError && !hasLoadedOnce.current) {
      toast({ title: 'Error', description: String(lastError?.message || lastError), variant: 'destructive' });
    }

    setLoading(false);
  };

  // Optimistic update for lead status changes
  const updateLeadStatus = useOptimisticMutation({
    mutationFn: async ({ id, status }: { id: string; status: any }) => {
      const { error } = await supabase
        .from('leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    queryKey: ['leads'],
    updateFn: (oldData: any[], { id, status }: { id: string; status: any }) => {
      if (!oldData) return oldData;
      return oldData.map(lead => 
        lead.id === id ? { ...lead, status } : lead
      );
    },
    successMessage: 'Lead status updated',
    errorMessage: 'Failed to update lead status',
  });

  const handleQuickStatusChange = (leadId: string, newStatus: any) => {
    updateLeadStatus.mutate({ id: leadId, status: newStatus });
    // Refresh after mutation completes
    setTimeout(loadLeads, 500);
  };

  const loadUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setUsers([]);
        return;
      }

      const { data, error } = await supabase.rpc('get_assignable_users');
      
      if (error) {
        console.error('Error loading users:', error);
        setUsers([]);
        return;
      }

      const unique = Array.from(new Set((data || []).map((u: any) => u.user_id)));
      const userList = unique.map((id: string, idx: number) => ({ id, name: `User ${idx + 1}` }));
      setUsers(userList);
    } catch (error: any) {
      console.error('Error loading users:', error);
      setUsers([]);
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

      // Trigger workflow for record deletion
      try {
        await workflowService.triggerWorkflows({
          workflow_id: '',
          trigger_record_id: id,
          trigger_module: 'leads',
          trigger_data: {
            ...leadToDelete,
            entity_type: 'lead',
          },
        });
      } catch (workflowError) {
        console.error('⚠️ Workflow trigger failed (non-critical):', workflowError);
      }

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

  const getCurrentFilters = () => {
    const currentFilters: Record<string, any> = {};
    if (filters.status) currentFilters.status = filters.status;
    if (filters.source) currentFilters.source = filters.source;
    if (filters.serviceId) currentFilters.service_id = filters.serviceId;
    if (filters.assignedTo) currentFilters.assigned_to = filters.assignedTo;
    if (filters.createdFrom) currentFilters.created_from = filters.createdFrom;
    if (filters.createdTo) currentFilters.created_to = filters.createdTo;
    return Object.keys(currentFilters).length > 0 ? currentFilters : undefined;
  };

  const handleBulkStatusChange = async (data: Record<string, any>) => {
    const performAction = async () => {
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
        bulkSelection.selectionMode,
        data.status,
        user.id,
        Array.from(bulkSelection.selectedIds),
        bulkSelection.isAllMatchingSelected ? getCurrentFilters() : undefined
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

    if (bulkSelection.isAllMatchingSelected) {
      setConfirmBulkAction({
        open: true,
        action: `change status to "${data.status}" for`,
        callback: performAction
      });
    } else {
      await performAction();
    }
  };

  const handleBulkAssign = async (data: Record<string, any>) => {
    const performAction = async () => {
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
        bulkSelection.selectionMode,
        data.assignedTo,
        user.id,
        Array.from(bulkSelection.selectedIds),
        bulkSelection.isAllMatchingSelected ? getCurrentFilters() : undefined
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

    if (bulkSelection.isAllMatchingSelected) {
      setConfirmBulkAction({
        open: true,
        action: 'assign to user for',
        callback: performAction
      });
    } else {
      await performAction();
    }
  };

  const handleSelectAllFiltered = async () => {
    const { data } = await supabase
      .from('leads')
      .select('id')
      .limit(totalCount);
    
    if (data) {
      data.forEach(item => bulkSelection.toggleItem(item.id));
      toast({
        title: 'All items selected',
        description: `Selected all ${totalCount} leads matching current filter`
      });
    }
  };

  const handleBulkDelete = async () => {
    const performDelete = async () => {
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
        bulkSelection.selectionMode,
        Array.from(bulkSelection.selectedIds),
        bulkSelection.isAllMatchingSelected ? getCurrentFilters() : undefined,
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

      bulkSelection.deselectAll();
      loadLeads();

      toast({
        title: 'Success',
        description: `Deleted ${result.success} lead${result.success !== 1 ? 's' : ''}`,
      });
      setBulkDeleteOpen(false);
    };

    if (bulkSelection.isAllMatchingSelected) {
      setConfirmBulkAction({
        open: true,
        action: 'permanently delete',
        callback: performDelete
      });
    } else {
      await performDelete();
    }
  };

  const handleBulkExport = async () => {
    try {
      await BulkOperationsService.bulkExport(
        'leads',
        bulkSelection.selectionMode,
        Array.from(bulkSelection.selectedIds),
        bulkSelection.isAllMatchingSelected ? getCurrentFilters() : undefined
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
      await BulkOperationsService.bulkTagsUpdate('leads', bulkSelection.selectionMode, tags, mode, user.id, Array.from(bulkSelection.selectedIds), bulkSelection.isAllMatchingSelected ? getCurrentFilters() : undefined);
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
  const canBulkEdit = userRole === 'Super Admin' || userRole === 'Admin' || leads.every(l => bulkSelection.selectedIds.has(l.id) ? l.assigned_to === users.find(u => u.id)?.id : true);
  const canBulkDelete = userRole === 'Super Admin' || userRole === 'Admin';

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
    <div className="container mx-auto px-4 py-8 max-w-full overflow-x-hidden">
      {/* Saved Views */}
      <SavedViewsBar
        module="leads"
        currentFilters={filters}
        onViewSelect={(viewFilters) => setFilters(viewFilters)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 w-full">
        <div>
          <h1 className="text-4xl font-bold">Leads</h1>
          <p className="text-muted-foreground mt-1">
            Manage incoming leads and convert them to accounts
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setFilterPanelOpen(true)}
            className="w-full sm:w-auto min-h-[44px]"
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
              className="w-full sm:w-auto min-h-[44px]"
            />
            {!isMobile && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Lead
              </Button>
            )}
        </div>
      </div>

      {/* Mobile Action Button */}
      <MobileActionButton
        onClick={() => setShowCreateForm(true)}
        icon={<Plus className="h-5 w-5" />}
        label="Create New Lead"
      />

      {/* Select All Filtered Prompt */}
      {bulkSelection.selectedCount > 0 && bulkSelection.selectedCount < totalCount && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="text-sm text-blue-900">
            {bulkSelection.selectedCount} selected
          </span>
          <button
            onClick={handleSelectAllFiltered}
            className="text-sm text-blue-600 hover:text-blue-800 underline font-medium min-h-[44px] px-2"
          >
            Select all {totalCount} items matching filter
          </button>
        </div>
      )}

      {/* Filter Chips */}
      <FilterChips
        filters={filters}
        onRemove={(key) => updateFilter(key, null)}
        onClearAll={clearFilters}
      />

      {/* Bulk Select All Banner */}
      {bulkSelection.isAllSelected && !bulkSelection.isAllMatchingSelected && totalCount > leads.length && (
        <BulkSelectAllBanner
          visibleCount={leads.length}
          totalCount={totalCount}
          isAllMatchingSelected={bulkSelection.isAllMatchingSelected}
          onSelectAllMatching={() => bulkSelection.selectAllMatching(totalCount)}
          onClear={bulkSelection.deselectAll}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-4 w-full">
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-w-0">
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
        <div className="lg:col-span-3 min-w-0">
          {(!hasLoadedOnce.current && loading) ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <ResponsiveList
              items={leads}
              emptyMessage="No leads found"
              renderCard={(lead, index) => (
                <MobileCard key={lead.id} onClick={() => navigate(`/dashboard/leads/${lead.id}`)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 min-w-0">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={bulkSelection.isSelected(lead.id)}
                            onCheckedChange={() => bulkSelection.toggleItem(lead.id)}
                          />
                        </div>
                        <h3 className="font-bold text-lg truncate max-w-full">
                          {lead.first_name} {lead.last_name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <LeadStatusBadge status={lead.status} />
                        {lead.is_emergency && (
                          <Badge variant="destructive" className="text-xs">Emergency</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <MobileCardField 
                    label="Service" 
                    value={
                      <div className="space-y-1">
                        <div>{lead.service?.name || lead.service_needed || 'N/A'}</div>
                        {lead.lead_source && lead.lead_source !== 'web_form' && (
                          <Badge variant="outline" className="text-xs">
                            {lead.lead_source === 'service_page' ? 'Service Page' : lead.lead_source}
                          </Badge>
                        )}
                      </div>
                    } 
                  />
                  <MobileCardField 
                    label="Email" 
                    value={
                      <a href={`mailto:${lead.email}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                        {lead.email}
                      </a>
                    } 
                  />
                  <MobileCardField 
                    label="Phone" 
                    value={
                      <a href={`tel:${lead.phone}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                        {formatPhone(lead.phone)}
                      </a>
                    } 
                  />
                  <MobileCardField 
                    label="Location" 
                    value={`${lead.city}, ${lead.state}`} 
                  />
                  <MobileCardField 
                    label="Created" 
                    value={formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })} 
                  />
                  
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingLead(lead);
                      }}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    {lead.status !== 'converted' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setConvertingLead(lead);
                        }}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Convert
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(lead.id);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </MobileCard>
              )}
              renderTable={() => (
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
                        {leads.map((lead) => (
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
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {lead.service?.name || lead.service_needed}
                                </div>
                                {lead.lead_source && lead.lead_source !== 'web_form' && (
                                  <Badge variant="outline" className="text-xs">
                                    {lead.lead_source === 'service_page' ? 'Service Page' : lead.lead_source}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
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
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              )}
            />
          )}
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

    {/* Bulk Confirmation Modal */}
    <BulkConfirmationModal
      open={confirmBulkAction?.open || false}
      onOpenChange={(open) => !open && setConfirmBulkAction(null)}
      totalCount={bulkSelection.selectedCount}
      action={confirmBulkAction?.action || ''}
      onConfirm={() => {
        confirmBulkAction?.callback();
        setConfirmBulkAction(null);
      }}
    />
  </div>
);
};

export default Leads;