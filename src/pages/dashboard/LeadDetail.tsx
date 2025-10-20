import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeadStatusBadge } from '@/components/admin/leads/LeadStatusBadge';
import { LeadForm } from '@/components/admin/leads/LeadForm';
import { LeadConvert } from '@/components/admin/leads/LeadConvert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import NotesSection from '@/components/admin/notes/NotesSection';
import ActivityFeed from '@/components/admin/ActivityFeed';
import { CRUDLogger } from '@/lib/crudLogger';
import { EntityActivityTab } from '@/components/admin/EntityActivityTab';
import { SendEmailModal } from '@/components/admin/email/SendEmailModal';
import EmailHistory from '@/components/admin/email/EmailHistory';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Edit, 
  Trash2, 
  CheckCircle,
  AlertCircle,
  StickyNote,
  ListTodo,
  MapPin,
  Calendar,
  User,
  Loader2,
  Send
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    loadLead();
    loadUsers();
  }, [id]);

  const loadLead = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setLead(data);
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

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus as any })
        .eq('id', id);

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        action: 'updated',
        entity_type: 'lead',
        entity_id: id
      });

      setLead({ ...lead, status: newStatus as any });
      toast({
        title: 'Success',
        description: 'Status updated successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReassign = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ assigned_to: userId === 'unassigned' ? null : userId })
        .eq('id', id);

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        action: 'updated',
        entity_type: 'lead',
        entity_id: id
      });

      setLead({ ...lead, assigned_to: userId === 'unassigned' ? null : userId } as any);
      toast({
        title: 'Success',
        description: 'Lead reassigned successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const leadName = lead ? `${lead.first_name} ${lead.last_name}` : 'Unknown';
      
      const { error } = await supabase.from('leads').delete().eq('id', id);

      if (error) throw error;

      await CRUDLogger.logDelete({
        userId: user.id,
        entityType: 'lead',
        entityId: id!,
        entityName: leadName
      });

      toast({
        title: 'Success',
        description: 'Lead deleted successfully'
      });

      navigate('/dashboard/leads');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!lead) {
    return (
      <>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Lead not found</h2>
            <Button onClick={() => navigate('/dashboard/leads')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Leads
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard/leads')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Leads
        </Button>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="emails">Emails</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel (70%) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lead Information Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl mb-2">
                      {lead.first_name} {lead.last_name}
                    </CardTitle>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Select 
                          value={lead.status} 
                          onValueChange={handleStatusChange}
                          disabled={updatingStatus}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {lead.is_emergency && (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-semibold">Emergency</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <LeadStatusBadge status={lead.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      <span>Created</span>
                    </div>
                    <p className="font-medium">
                      {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <User className="h-4 w-4" />
                      <span>Source</span>
                    </div>
                    <p className="font-medium capitalize">{lead.source?.replace('_', ' ')}</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Assigned To</span>
                    <Select 
                      value={lead.assigned_to || 'unassigned'}
                      onValueChange={handleReassign}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{lead.email}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${lead.email}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Email
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowEmailModal(true)}>
                    <Send className="mr-2 h-4 w-4" />
                    Send Template
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{formatPhone(lead.phone)}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${lead.phone}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Call
                    </a>
                  </Button>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">
                      {lead.street_address}
                      {lead.unit && `, ${lead.unit}`}
                      <br />
                      {lead.city}, {lead.state} {lead.zip}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Details */}
            <Card>
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Service Needed</p>
                  <p className="font-medium">{lead.service_needed}</p>
                </div>
                {lead.project_details && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Project Details</p>
                    <p className="text-sm">{lead.project_details}</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={lead.is_emergency} 
                    disabled 
                    className="h-4 w-4"
                  />
                  <span className="text-sm">This is an emergency</span>
                </div>
              </CardContent>
            </Card>

            {/* Conversion Info */}
            {lead.status === 'converted' && lead.converted_account_id && (
              <Card className="border-purple-500/20 bg-purple-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold mb-1">Converted to Account</p>
                      <p className="text-sm text-muted-foreground">
                        This lead has been converted to an account
                      </p>
                    </div>
                    <Button onClick={() => navigate(`/dashboard/accounts/${lead.converted_account_id}`)}>
                      View Account →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel (30%) */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lead.status !== 'converted' && (
                  <Button 
                    className="w-full" 
                    onClick={() => setConvertModalOpen(true)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Convert to Account
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setEditFormOpen(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Lead
                </Button>
                <Button variant="outline" className="w-full">
                  <StickyNote className="mr-2 h-4 w-4" />
                  Add Note
                </Button>
                <Button variant="outline" className="w-full">
                  <ListTodo className="mr-2 h-4 w-4" />
                  Create Task
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Lead
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Activity log coming soon</p>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <NotesSection entityType="lead" entityId={id!} />
              </CardContent>
            </Card>

            {/* Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Tasks coming soon</p>
              </CardContent>
            </Card>
          </div>
        </div>
          </TabsContent>

          <TabsContent value="emails">
            <EmailHistory entityType="lead" entityId={id!} />
          </TabsContent>

          <TabsContent value="activity">
            <EntityActivityTab entityType="lead" entityId={id!} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {editFormOpen && (
        <LeadForm
          isOpen={true}
          onClose={() => setEditFormOpen(false)}
          onSuccess={() => {
            loadLead();
            setEditFormOpen(false);
          }}
          lead={lead}
          users={users}
        />
      )}

      {convertModalOpen && (
        <LeadConvert
          isOpen={true}
          onClose={() => setConvertModalOpen(false)}
          lead={lead}
        />
      )}

      <SendEmailModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        entityType="lead"
        entityId={id!}
        recipientEmail={lead.email}
        recipientName={`${lead.first_name} ${lead.last_name}`}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this lead. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LeadDetail;