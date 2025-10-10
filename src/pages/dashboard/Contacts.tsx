import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ContactForm } from '@/components/admin/accounts/ContactForm';
import { ContactAdvancedFilters } from '@/components/admin/contacts/ContactAdvancedFilters';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, Building2, Mail, Phone, Download, Filter } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CRUDLogger } from '@/lib/crudLogger';
import { ExportButton } from '@/components/admin/ExportButton';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { FilterChips } from '@/components/filters/FilterChips';
import { SavedViewsBar } from '@/components/filters/SavedViewsBar';
import { useUrlFilters } from '@/hooks/useUrlFilters';

const Contacts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { filters, setFilters, updateFilter, clearFilters } = useUrlFilters();
  const [contacts, setContacts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  useEffect(() => {
    fetchContacts();
    fetchAccounts();
  }, [filters]);

  const fetchAccounts = async () => {
    const { data } = await supabase
      .from('accounts')
      .select('id, account_name');
    
    if (data) {
      const accountsMap = data.reduce((acc, account) => {
        acc[account.id] = account;
        return acc;
      }, {} as Record<string, any>);
      setAccounts(accountsMap);
    }
  };

  const fetchContacts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply advanced filters
      if (filters.accountId) {
        query = query.eq('account_id', filters.accountId);
      }
      if (filters.jobTitle) {
        query = query.ilike('title', `%${filters.jobTitle}%`);
      }
      if (filters.hasEmail) {
        query = query.not('email', 'is', null);
      }
      if (filters.hasPhone) {
        query = query.not('phone', 'is', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setContacts(data || []);
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

  const handleDelete = async (contact: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await CRUDLogger.logDelete({
          userId: user.id,
          entityType: 'account',
          entityId: contact.id,
          entityName: `${contact.first_name} ${contact.last_name}`,
        });
      }

      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Contact deleted successfully'
      });

      fetchContacts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    const accountName = accounts[contact.account_id]?.account_name?.toLowerCase() || '';
    return (
      fullName.includes(search) ||
      contact.email?.toLowerCase().includes(search) ||
      contact.phone?.includes(search) ||
      accountName.includes(search)
    );
  });

  const activeFilterCount = Object.keys(filters).filter(
    (key) => filters[key] !== null && filters[key] !== undefined && filters[key] !== ''
  ).length;


  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Saved Views */}
        <SavedViewsBar
          module="contacts"
          currentFilters={filters}
          onViewSelect={(viewFilters) => setFilters(viewFilters)}
        />

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
            <p className="text-muted-foreground">Manage your contact relationships</p>
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
              data={filteredContacts.map(contact => ({
                ...contact,
                account_name: accounts[contact.account_id]?.account_name || ''
              }))}
              moduleName="contacts"
              columns={[
                'id', 'first_name', 'last_name', 'email', 'phone', 'title',
                'account_name', 'is_primary', 'created_at'
              ]}
              filters={filters}
              isFiltered={activeFilterCount > 0}
              filteredCount={filteredContacts.length}
            />
            <Button onClick={() => {
              setEditingContact(null);
              setSelectedAccountId('');
              setShowContactForm(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              New Contact
            </Button>
          </div>
        </div>

        {/* Filter Chips */}
        <FilterChips
          filters={filters}
          onRemove={(key) => updateFilter(key, null)}
          onClearAll={clearFilters}
        />

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Primary</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading contacts...
                  </TableCell>
                </TableRow>
              ) : filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No contacts found
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts.map((contact) => (
                  <TableRow 
                    key={contact.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/dashboard/contacts/${contact.id}`)}
                  >
                    <TableCell className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {accounts[contact.account_id]?.account_name || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {contact.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {contact.phone}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.title || '—'}
                    </TableCell>
                    <TableCell>
                      {contact.is_primary && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          Primary
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingContact(contact);
                            setSelectedAccountId(contact.account_id);
                            setShowContactForm(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {contact.first_name} {contact.last_name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(contact)}>
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

        <ContactForm
          open={showContactForm}
          onOpenChange={setShowContactForm}
          accountId={selectedAccountId}
          contact={editingContact}
          onSuccess={fetchContacts}
        />

        {/* Advanced Filter Panel */}
        <FilterPanel
          open={filterPanelOpen}
          onClose={() => setFilterPanelOpen(false)}
          title="Filter Contacts"
          onClearAll={clearFilters}
        >
          <ContactAdvancedFilters
            values={filters}
            onChange={updateFilter}
          />
        </FilterPanel>
      </div>
    </AdminLayout>
  );
};

export default Contacts;
