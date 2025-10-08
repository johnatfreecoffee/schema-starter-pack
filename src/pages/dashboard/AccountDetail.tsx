import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AccountStatusBadge } from '@/components/admin/accounts/AccountStatusBadge';
import { AccountForm } from '@/components/admin/accounts/AccountForm';
import { ContactForm } from '@/components/admin/accounts/ContactForm';
import { AddressForm } from '@/components/admin/accounts/AddressForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Edit, Plus, Phone, Mail, MapPin, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';
import NotesSection from '@/components/admin/notes/NotesSection';

const AccountDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [account, setAccount] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  const fetchAccountData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Fetch account
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', id)
        .single();

      if (accountError) throw accountError;
      setAccount(accountData);

      // Fetch contacts
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('*')
        .eq('account_id', id)
        .order('is_primary', { ascending: false });
      setContacts(contactsData || []);

      // Fetch addresses
      const { data: addressesData } = await supabase
        .from('addresses')
        .select('*')
        .eq('account_id', id)
        .order('is_primary', { ascending: false });
      setAddresses(addressesData || []);

      // Fetch projects (stub - will be implemented later)
      // For now, just set empty array
      setProjects([]);

      // Fetch tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('related_to_type', 'account')
        .eq('related_to_id', id)
        .order('created_at', { ascending: false });
      setTasks(tasksData || []);

      // Fetch notes
      const { data: notesData } = await supabase
        .from('notes')
        .select('*')
        .eq('related_to_type', 'account')
        .eq('related_to_id', id)
        .order('created_at', { ascending: false });
      setNotes(notesData || []);

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
    fetchAccountData();
  }, [id]);

  const handleDeleteContact = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Contact deleted successfully' });
      fetchAccountData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Address deleted successfully' });
      fetchAccountData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleArchiveAccount = async () => {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Account archived successfully' });
      navigate('/dashboard/accounts');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const primaryContact = contacts.find(c => c.is_primary) || contacts[0];
  const primaryAddress = addresses.find(a => a.is_primary) || addresses[0];

  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <p>Loading account details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!account) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <p>Account not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard/accounts')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Accounts
          </Button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">{account.account_name}</h1>
              <div className="flex gap-2 items-center">
                <AccountStatusBadge status={account.status} />
                {account.source_lead_id && (
                  <Badge variant="outline">
                    From Lead
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  Created {formatDistanceToNow(new Date(account.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAccountForm(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Account
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Archive
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Archive Account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will archive {account.account_name}. The account and all related data will be preserved but hidden from active views.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleArchiveAccount}>
                      Archive Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
            <TabsTrigger value="addresses">Addresses ({addresses.length})</TabsTrigger>
            <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
            <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Industry:</span>
                    <p>{account.industry || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Website:</span>
                    {account.website ? (
                      <a href={account.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {account.website}
                      </a>
                    ) : (
                      <p>Not specified</p>
                    )}
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Notes:</span>
                    <p className="whitespace-pre-wrap">{account.notes || 'No notes'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Primary Contact</CardTitle>
                </CardHeader>
                <CardContent>
                  {primaryContact ? (
                    <div className="space-y-2">
                      <div>
                        <p className="font-medium">{primaryContact.first_name} {primaryContact.last_name}</p>
                        {primaryContact.title && (
                          <p className="text-sm text-muted-foreground">{primaryContact.title}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <a href={`mailto:${primaryContact.email}`} className="flex items-center gap-2 text-primary hover:underline">
                          <Mail className="h-4 w-4" />
                          {primaryContact.email}
                        </a>
                        <a href={`tel:${primaryContact.phone}`} className="flex items-center gap-2 text-primary hover:underline">
                          <Phone className="h-4 w-4" />
                          {primaryContact.phone}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No primary contact set</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Primary Address</CardTitle>
                </CardHeader>
                <CardContent>
                  {primaryAddress ? (
                    <div>
                      <p>{primaryAddress.street_address}</p>
                      {primaryAddress.unit && <p>{primaryAddress.unit}</p>}
                      <p>{primaryAddress.city}, {primaryAddress.state} {primaryAddress.zip}</p>
                      <a 
                        href={`https://maps.google.com/?q=${encodeURIComponent(`${primaryAddress.street_address} ${primaryAddress.city} ${primaryAddress.state} ${primaryAddress.zip}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline mt-2"
                      >
                        <MapPin className="h-4 w-4" />
                        View on Google Maps
                      </a>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No primary address set</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Projects:</span>
                    <span className="font-medium">{projects.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pending Tasks:</span>
                    <span className="font-medium">{tasks.filter(t => t.status === 'pending').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Notes:</span>
                    <span className="font-medium">{notes.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Contacts</CardTitle>
                <Button onClick={() => {
                  setEditingContact(null);
                  setShowContactForm(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </CardHeader>
              <CardContent>
                {contacts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No contacts yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Primary</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell className="font-medium">
                            {contact.first_name} {contact.last_name}
                          </TableCell>
                          <TableCell>
                            <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                              {contact.email}
                            </a>
                          </TableCell>
                          <TableCell>
                            <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                              {contact.phone}
                            </a>
                          </TableCell>
                          <TableCell>{contact.title || '-'}</TableCell>
                          <TableCell>
                            {contact.is_primary && <Badge>Primary</Badge>}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setEditingContact(contact);
                                  setShowContactForm(true);
                                }}
                              >
                                Edit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive">Delete</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete {contact.first_name} {contact.last_name} from this account.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteContact(contact.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Addresses</CardTitle>
                <Button onClick={() => {
                  setEditingAddress(null);
                  setShowAddressForm(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
                </Button>
              </CardHeader>
              <CardContent>
                {addresses.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No addresses yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>Zip</TableHead>
                        <TableHead>Primary</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {addresses.map((address) => (
                        <TableRow key={address.id}>
                          <TableCell>
                            <Badge variant="outline">{address.address_type}</Badge>
                          </TableCell>
                          <TableCell>
                            {address.street_address}
                            {address.unit && ` ${address.unit}`}
                          </TableCell>
                          <TableCell>{address.city}</TableCell>
                          <TableCell>{address.state}</TableCell>
                          <TableCell>{address.zip}</TableCell>
                          <TableCell>
                            {address.is_primary && <Badge>Primary</Badge>}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setEditingAddress(address);
                                  setShowAddressForm(true);
                                }}
                              >
                                Edit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive">Delete</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Address?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete this address from this account.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteAddress(address.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle>Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Projects module coming soon
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Tasks module coming soon
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <NotesSection entityType="account" entityId={id!} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <AccountForm
        open={showAccountForm}
        onOpenChange={setShowAccountForm}
        account={account}
        onSuccess={fetchAccountData}
      />

      {id && (
        <>
          <ContactForm
            open={showContactForm}
            onOpenChange={setShowContactForm}
            accountId={id}
            contact={editingContact}
            onSuccess={() => {
              fetchAccountData();
              setEditingContact(null);
            }}
          />

          <AddressForm
            open={showAddressForm}
            onOpenChange={setShowAddressForm}
            accountId={id}
            address={editingAddress}
            onSuccess={() => {
              fetchAccountData();
              setEditingAddress(null);
            }}
          />
        </>
      )}
    </AdminLayout>
  );
};

export default AccountDetail;
