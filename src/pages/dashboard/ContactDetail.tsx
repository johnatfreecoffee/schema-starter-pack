import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContactForm } from '@/components/admin/accounts/ContactForm';
import { AddressManager } from '@/components/admin/accounts/AddressManager';
import NotesSection from '@/components/admin/notes/NotesSection';
import ActivityFeed from '@/components/admin/ActivityFeed';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Edit, Building2, Mail, Phone, Smartphone, Briefcase, FileText } from 'lucide-react';
import { EntityActivityTab } from '@/components/admin/EntityActivityTab';

const ContactDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [contact, setContact] = useState<any>(null);
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);

  useEffect(() => {
    fetchContactData();
  }, [id]);

  const fetchContactData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();

      if (contactError) throw contactError;
      setContact(contactData);

      if (contactData.account_id) {
        const { data: accountData } = await supabase
          .from('accounts')
          .select('*')
          .eq('id', contactData.account_id)
          .single();
        setAccount(accountData);
      }

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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading contact...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!contact) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold">Contact not found</h2>
          <Button className="mt-4" onClick={() => navigate('/dashboard/contacts')}>
            Back to Contacts
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/contacts')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {contact.first_name} {contact.last_name}
              </h1>
              {contact.title && (
                <p className="text-muted-foreground">{contact.title}</p>
              )}
            </div>
          </div>
          <Button onClick={() => setShowContactForm(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Contact
          </Button>
        </div>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{contact.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{contact.phone}</p>
                    </div>
                  </div>
                  {contact.mobile && (
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Mobile</p>
                        <p className="font-medium">{contact.mobile}</p>
                      </div>
                    </div>
                  )}
                  {contact.title && (
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Title</p>
                        <p className="font-medium">{contact.title}</p>
                      </div>
                    </div>
                  )}
                  {contact.department && (
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Department</p>
                        <p className="font-medium">{contact.department}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                </CardHeader>
                <CardContent>
                  {account ? (
                    <Link 
                      to={`/dashboard/accounts/${account.id}`}
                      className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Building2 className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">{account.account_name}</p>
                        {contact.is_primary && (
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary mt-1">
                            Primary Contact
                          </span>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <p className="text-muted-foreground">No account associated</p>
                  )}
                </CardContent>
              </Card>

              {contact.notes && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Internal Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{contact.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="addresses">
            <AddressManager 
              entityType="contact" 
              entityId={id!} 
            />
          </TabsContent>

          <TabsContent value="notes">
            <NotesSection entityType="account" entityId={id!} />
          </TabsContent>

          <TabsContent value="activity">
            <EntityActivityTab entityType="contact" entityId={id!} />
          </TabsContent>
        </Tabs>
      </div>

      <ContactForm
        open={showContactForm}
        onOpenChange={setShowContactForm}
        accountId={contact.account_id}
        contact={contact}
        onSuccess={fetchContactData}
      />
    </AdminLayout>
  );
};

export default ContactDetail;
