import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ResponsiveList, MobileCard, MobileCardField } from '@/components/ui/responsive-table';
import { MobileActionButton } from '@/components/ui/mobile-action-button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { AccountStatusBadge } from '@/components/admin/accounts/AccountStatusBadge';
import { AccountFilters } from '@/components/admin/accounts/AccountFilters';
import { AccountForm } from '@/components/admin/accounts/AccountForm';
import { AccountAdvancedFilters } from '@/components/admin/accounts/AccountAdvancedFilters';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Phone, Mail, Download, Filter, Trash2, UserPlus, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CRUDLogger } from '@/lib/crudLogger';
import { ExportButton } from '@/components/admin/ExportButton';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { FilterChips } from '@/components/filters/FilterChips';
import { SavedViewsBar } from '@/components/filters/SavedViewsBar';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { BulkActionsBar } from '@/components/admin/bulk/BulkActionsBar';
import { BulkOperationModal } from '@/components/admin/bulk/BulkOperationModal';
import { BulkDeleteConfirmation } from '@/components/admin/bulk/BulkDeleteConfirmation';
import { BulkOperationsService } from '@/services/bulkOperationsService';
import { BulkTagsModal } from '@/components/admin/bulk/BulkTagsModal';
import { useBulkUndo } from '@/hooks/useBulkUndo';
import { BulkUndoToast } from '@/components/admin/bulk/BulkUndoToast';
import { useUserRole } from '@/hooks/useUserRole';

const Accounts = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { filters, setFilters, updateFilter, clearFilters } = useUrlFilters();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    active: 0,
    inactive: 0,
    archived: 0
  });

  const bulk = useBulkSelection(accounts);
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [tagsModalOpen, setTagsModalOpen] = useState(false);
  const { role } = useUserRole();
  const { undoState, saveUndoState, performUndo, clearUndo } = useBulkUndo();

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('accounts')
        .select(`
          *,
          contacts!inner(first_name, last_name, email, phone, is_primary),
          addresses!inner(city, state, is_primary),
          projects(count)
        `, { count: 'exact' }) as any;

      // Apply advanced filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.industry) {
        query = query.ilike('industry', `%${filters.industry}%`);
      }

      if (filters.createdFrom) {
        query = query.gte('created_at', new Date(filters.createdFrom).toISOString());
      }

      if (filters.createdTo) {
        query = query.lte('created_at', new Date(filters.createdTo).toISOString());
      }

      const { data, error, count } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setTotalCount(count || 0);

      // Process data to get primary contact and address
      const processedData = data?.map(account => ({
        ...account,
        primary_contact: account.contacts?.find((c: any) => c.is_primary) || account.contacts?.[0],
        primary_address: account.addresses?.find((a: any) => a.is_primary) || account.addresses?.[0],
        project_count: account.projects?.length || 0
      }));

      setAccounts(processedData || []);
      
      // Calculate status counts
      const { data: countData } = await supabase
        .from('accounts')
        .select('status');
      
      const counts = { active: 0, inactive: 0, archived: 0 };
      countData?.forEach((account: any) => {
        counts[account.status as keyof typeof counts]++;
      });
      setStatusCounts(counts);
      
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

  useEffect(() => {
    fetchAccounts();
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, roles(name)')
        .in('roles.name', ['Admin','Super Admin','CRM User','Sales Manager','Technician','Office Staff','Read-Only User']);

      if (error) throw error;

      const userList = data?.map((ur: any, idx: number) => ({
        id: ur.user_id,
        name: `User ${idx + 1}`
      })) || [];

      setUsers(userList);
    } catch (error: any) {
      console.error('Error loading users:', error);
    }
  };

  const totalAccounts = accounts.length;
  const activeFilterCount = Object.keys(filters).filter(
    (key) => filters[key] !== null && filters[key] !== undefined && filters[key] !== ''
  ).length;

  const handleSelectAllFiltered = async () => {
    const { data } = await supabase
      .from('accounts')
      .select('id')
      .limit(totalCount);
    
    if (data) {
      data.forEach(item => bulk.toggleItem(item.id));
      toast({
        title: 'All items selected',
        description: `Selected all ${totalCount} accounts matching current filter`
      });
    }
  };

  const handleBulkAction = async (actionId: string) => {
    if (actionId === 'delete') {
      setBulkDeleteOpen(true);
    } else if (actionId === 'tags') {
      setTagsModalOpen(true);
    } else if (actionId === 'export') {
      await BulkOperationsService.bulkExport('accounts', Array.from(bulk.selectedIds));
      toast({ title: 'Success', description: `${bulk.selectedCount} accounts exported` });
    } else {
      setBulkAction(actionId);
    }
  };

  const handleBulkDelete = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await BulkOperationsService.bulkDelete('accounts', Array.from(bulk.selectedIds), user.id);
    toast({ title: 'Success', description: `Deleted ${bulk.selectedCount} accounts` });
    bulk.deselectAll();
    fetchAccounts();
  };

  const handleBulkStatusChange = async (formData: Record<string, any>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Store previous values for undo
    const previousValues = bulk.selectedItems.map(a => ({ id: a.id, status: a.status }));

    await BulkOperationsService.bulkStatusChange('accounts', Array.from(bulk.selectedIds), formData.status, user.id);
    
    // Save undo state
    saveUndoState({
      operation: 'status',
      module: 'accounts',
      itemIds: Array.from(bulk.selectedIds),
      previousValues,
      timestamp: new Date(),
    });

    toast({ title: 'Success', description: `Updated status for ${bulk.selectedCount} accounts` });
    bulk.deselectAll();
    fetchAccounts();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.shiftKey) {
        e.preventDefault();
        bulk.selectAll();
      }
      if (e.key === 'Escape' && bulk.selectedCount > 0) {
        bulk.deselectAll();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bulk.selectedCount]);

  // Permission controls
  const canBulkEdit = role === 'Super Admin' || role === 'Admin' || bulk.selectedItems.every(item => item.created_by === users[0]?.id);
  const canBulkDelete = role === 'Super Admin' || role === 'Admin';


  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-full overflow-x-hidden">
        {/* Saved Views */}
        <SavedViewsBar
          module="accounts"
          currentFilters={filters}
          onViewSelect={(viewFilters) => setFilters(viewFilters)}
        />

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold truncate">Accounts</h1>
            <p className="text-muted-foreground mt-1">
              Showing {totalAccounts} account{totalAccounts !== 1 ? 's' : ''}
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
              data={accounts}
              moduleName="accounts"
              filters={filters}
              isFiltered={activeFilterCount > 0}
              filteredCount={accounts.length}
            />
            {!isMobile && (
              <Button onClick={() => setShowAccountForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Account
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Action Button */}
        <MobileActionButton
          onClick={() => setShowAccountForm(true)}
          icon={<Plus className="h-5 w-5" />}
          label="Create New Account"
        />

        {/* Select All Filtered Prompt */}
        {bulk.selectedCount > 0 && bulk.selectedCount < totalCount && (
          <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-sm text-blue-900">
              {bulk.selectedCount} selected
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

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : (
          <ResponsiveList
            items={accounts}
            emptyMessage="No accounts found"
            renderCard={(account) => (
              <MobileCard key={account.id} onClick={() => window.location.href = `/dashboard/accounts/${account.id}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={bulk.isSelected(account.id)}
                          onCheckedChange={() => bulk.toggleItem(account.id)}
                        />
                      </div>
                      <h3 className="font-bold text-lg">{account.account_name}</h3>
                    </div>
                    <AccountStatusBadge status={account.status} />
                  </div>
                </div>
                
                {account.primary_contact && (
                  <MobileCardField 
                    label="Contact" 
                    value={
                      <div>
                        <div className="font-medium">
                          {account.primary_contact.first_name} {account.primary_contact.last_name}
                        </div>
                        <div className="text-sm">{account.primary_contact.email}</div>
                      </div>
                    }
                  />
                )}
                {account.primary_contact?.phone && (
                  <MobileCardField 
                    label="Phone" 
                    value={
                      <a href={`tel:${account.primary_contact.phone}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                        {account.primary_contact.phone}
                      </a>
                    }
                  />
                )}
                {account.primary_address && (
                  <MobileCardField 
                    label="Location" 
                    value={`${account.primary_address.city}, ${account.primary_address.state}`}
                  />
                )}
                <MobileCardField 
                  label="Projects" 
                  value={<Badge variant="secondary">{account.project_count}</Badge>}
                />
              </MobileCard>
            )}
            renderTable={() => (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={bulk.isAllSelected}
                          onCheckedChange={() => bulk.toggleAll(accounts)}
                          className="h-5 w-5"
                          style={{ minHeight: '44px', minWidth: '44px' }}
                        />
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Primary Contact</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Projects</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id} className="hover:bg-muted/50">
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={bulk.isSelected(account.id)}
                            onCheckedChange={() => bulk.toggleItem(account.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <AccountStatusBadge status={account.status} />
                        </TableCell>
                        <TableCell>
                          <Link 
                            to={`/dashboard/accounts/${account.id}`}
                            className="font-medium hover:underline"
                          >
                            {account.account_name}
                          </Link>
                          {account.source_lead_id && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              From Lead
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {account.primary_contact && (
                            <div>
                              <div className="font-medium">
                                {account.primary_contact.first_name} {account.primary_contact.last_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {account.primary_contact.email}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {account.primary_contact?.phone && (
                            <a 
                              href={`tel:${account.primary_contact.phone}`}
                              className="flex items-center gap-1 hover:text-primary"
                            >
                              <Phone className="h-3 w-3" />
                              {account.primary_contact.phone}
                            </a>
                          )}
                        </TableCell>
                        <TableCell>
                          {account.primary_address && (
                            <span>
                              {account.primary_address.city}, {account.primary_address.state}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{account.project_count}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(account.created_at), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          />
        )}

        <AccountForm
          open={showAccountForm}
          onOpenChange={setShowAccountForm}
          onSuccess={fetchAccounts}
        />

        {/* Advanced Filter Panel */}
        <FilterPanel
          open={filterPanelOpen}
          onClose={() => setFilterPanelOpen(false)}
          title="Filter Accounts"
          onClearAll={clearFilters}
        >
          <AccountAdvancedFilters
            values={filters}
            onChange={updateFilter}
            users={users}
          />
        </FilterPanel>

        <BulkActionsBar
          selectedCount={bulk.selectedCount}
          onClear={bulk.deselectAll}
          actions={[
            canBulkEdit && { id: 'status', label: 'Change Status', icon: <Badge className="h-4 w-4" /> },
            canBulkEdit && { id: 'tags', label: 'Manage Tags', icon: <Tag className="h-4 w-4" /> },
            canBulkEdit && { id: 'assign', label: 'Assign to User', icon: <UserPlus className="h-4 w-4" /> },
            { id: 'export', label: 'Export Selected', icon: <Download className="h-4 w-4" /> },
            canBulkDelete && { id: 'delete', label: 'Delete', icon: <Trash2 className="h-4 w-4" />, variant: 'destructive' as const },
          ].filter(Boolean) as any}
          onAction={handleBulkAction}
        />

        <BulkTagsModal
          open={tagsModalOpen}
          onOpenChange={setTagsModalOpen}
          selectedCount={bulk.selectedCount}
          module="accounts"
          onConfirm={async (tags, mode) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await BulkOperationsService.bulkTagsUpdate('accounts', Array.from(bulk.selectedIds), tags, mode, user.id);
            toast({ title: 'Success', description: `Tags updated for ${bulk.selectedCount} accounts` });
            bulk.deselectAll();
            fetchAccounts();
          }}
        />

        {undoState && (
          <BulkUndoToast count={undoState.itemIds.length} onUndo={performUndo} />
        )}

        <BulkOperationModal
          open={bulkAction === 'status'}
          onOpenChange={(open) => !open && setBulkAction(null)}
          title="Change Status"
          description="Update status for selected accounts"
          selectedCount={bulk.selectedCount}
          onConfirm={handleBulkStatusChange}
          fields={[
            { name: 'status', label: 'New Status', type: 'select', required: true, options: [
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'archived', label: 'Archived' }
            ]}
          ]}
        />

        <BulkDeleteConfirmation
          open={bulkDeleteOpen}
          onOpenChange={setBulkDeleteOpen}
          itemCount={bulk.selectedCount}
          itemType="accounts"
          itemNames={bulk.selectedItems.map(a => a.account_name)}
          onConfirm={handleBulkDelete}
        />
      </div>
    </AdminLayout>
  );
};

export default Accounts;
