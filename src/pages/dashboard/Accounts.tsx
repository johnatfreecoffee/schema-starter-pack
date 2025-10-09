import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AccountStatusBadge } from '@/components/admin/accounts/AccountStatusBadge';
import { AccountFilters } from '@/components/admin/accounts/AccountFilters';
import { AccountForm } from '@/components/admin/accounts/AccountForm';
import { AccountAdvancedFilters } from '@/components/admin/accounts/AccountAdvancedFilters';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Phone, Mail, Download, Filter } from 'lucide-react';
import { ExportService } from '@/services/exportService';
import { formatDistanceToNow } from 'date-fns';
import { CRUDLogger } from '@/lib/crudLogger';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { FilterChips } from '@/components/filters/FilterChips';
import { SavedViewsBar } from '@/components/filters/SavedViewsBar';
import { useUrlFilters } from '@/hooks/useUrlFilters';

const Accounts = () => {
  const { toast } = useToast();
  const { filters, setFilters, updateFilter, clearFilters } = useUrlFilters();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [statusCounts, setStatusCounts] = useState({
    active: 0,
    inactive: 0,
    archived: 0
  });

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
        `);

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

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

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
        .select('user_id')
        .in('role', ['admin', 'crm_user']);

      if (error) throw error;

      const userList = data?.map((ur, idx) => ({
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

  const handleExport = () => {
    const exportData = accounts.map(account => ({
      id: account.id,
      account_name: account.account_name,
      status: account.status,
      primary_contact: account.contacts?.[0] ? `${account.contacts[0].first_name} ${account.contacts[0].last_name}` : '',
      email: account.contacts?.[0]?.email || '',
      phone: account.contacts?.[0]?.phone || '',
      location: account.addresses?.[0] ? `${account.addresses[0].city}, ${account.addresses[0].state}` : '',
      project_count: account.projects?.length || 0,
      created_at: account.created_at
    }));
    ExportService.exportModuleToCSV(exportData, 'accounts');
    toast({ title: 'Success', description: 'Accounts exported successfully' });
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Saved Views */}
        <SavedViewsBar
          module="accounts"
          currentFilters={filters}
          onViewSelect={(viewFilters) => setFilters(viewFilters)}
        />

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold">Accounts</h1>
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
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowAccountForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Account
            </Button>
          </div>
        </div>

        {/* Filter Chips */}
        <FilterChips
          filters={filters}
          onRemove={(key) => updateFilter(key, null)}
          onClearAll={clearFilters}
        />

        {loading ? (
              <div className="text-center py-12">Loading accounts...</div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No accounts found</p>
                <Button onClick={() => setShowAccountForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Account
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
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
      </div>
    </AdminLayout>
  );
};

export default Accounts;
