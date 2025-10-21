import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, ExternalLink, Trash2, Pencil } from 'lucide-react';

interface OutletType {
  id: string;
  name: string;
  icon_url: string;
}

interface SocialMedia {
  id: string;
  outlet_type_id: string;
  custom_name: string | null;
  handle: string | null;
  link: string;
  social_media_outlet_types: OutletType;
}

export const SocialMediaManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SocialMedia | null>(null);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [handle, setHandle] = useState('');
  const [link, setLink] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch outlet types
  const { data: outletTypes = [] } = useQuery({
    queryKey: ['social-media-outlet-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_media_outlet_types')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as OutletType[];
    },
  });

  // Fetch company social media
  const { data: socialMedia = [], isLoading } = useQuery({
    queryKey: ['company-social-media'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_social_media')
        .select(`
          *,
          social_media_outlet_types (*)
        `)
        .order('created_at');
      if (error) throw error;
      return data as SocialMedia[];
    },
  });

  // Add mutation
  const addMutation = useMutation({
    mutationFn: async (values: { outlet_type_id: string; custom_name?: string; handle?: string; link: string }) => {
      const { error } = await supabase
        .from('company_social_media')
        .insert([values]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-social-media'] });
      queryClient.invalidateQueries({ queryKey: ['company-social-media-footer'] });
      toast.success('Social media link added successfully');
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to add social media: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (values: { id: string; outlet_type_id: string; custom_name?: string; handle?: string; link: string }) => {
      const { id, ...updateData } = values;
      const { error } = await supabase
        .from('company_social_media')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-social-media'] });
      queryClient.invalidateQueries({ queryKey: ['company-social-media-footer'] });
      toast.success('Social media link updated successfully');
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to update social media: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('company_social_media')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-social-media'] });
      queryClient.invalidateQueries({ queryKey: ['company-social-media-footer'] });
      toast.success('Social media link removed');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error) => {
      toast.error(`Failed to remove social media: ${error.message}`);
    },
  });

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setSelectedOutlet('');
    setCustomName('');
    setHandle('');
    setLink('');
  };

  const handleEditClick = (item: SocialMedia) => {
    setEditingItem(item);
    setSelectedOutlet(item.outlet_type_id);
    setCustomName(item.custom_name || '');
    setHandle(item.handle || '');
    setLink(item.link);
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (!selectedOutlet || !link) {
      toast.error('Please select an outlet and enter a link');
      return;
    }

    if (selectedOutlet === 'other' && !customName) {
      toast.error('Please enter a custom name for "Other"');
      return;
    }

    if (editingItem) {
      updateMutation.mutate({
        id: editingItem.id,
        outlet_type_id: selectedOutlet,
        custom_name: selectedOutlet === 'other' ? customName : null,
        handle: handle || null,
        link,
      });
    } else {
      addMutation.mutate({
        outlet_type_id: selectedOutlet,
        custom_name: selectedOutlet === 'other' ? customName : null,
        handle: handle || null,
        link,
      });
    }
  };

  const isOtherSelected = selectedOutlet === 'other';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Social Media Links</h3>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="secondary">
              <Plus className="mr-2 h-4 w-4" />
              Add Social Media
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Social Media Link' : 'Add Social Media Link'}</DialogTitle>
              <DialogDescription>
                {editingItem ? 'Update the social media link details.' : 'Select a social media outlet and provide the link details.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="outlet">Social Media Outlet *</Label>
                <Select value={selectedOutlet} onValueChange={setSelectedOutlet}>
                  <SelectTrigger id="outlet">
                    <SelectValue placeholder="Select outlet" />
                  </SelectTrigger>
                  <SelectContent>
                    {outletTypes.map((outlet) => (
                      <SelectItem key={outlet.id} value={outlet.id}>
                        <div className="flex items-center gap-2">
                          <img src={outlet.icon_url} alt={outlet.name} className="h-4 w-4" />
                          {outlet.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isOtherSelected && (
                <div className="space-y-2">
                  <Label htmlFor="customName">Custom Name *</Label>
                  <Input
                    id="customName"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Enter custom social media name"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="link">Social media outlet link *</Label>
                <Input
                  id="link"
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="handle">Handle (optional)</Label>
                <Input
                  id="handle"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="@username"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={addMutation.isPending || updateMutation.isPending}>
                {editingItem 
                  ? (updateMutation.isPending ? 'Updating...' : 'Update')
                  : (addMutation.isPending ? 'Adding...' : 'Add')
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : socialMedia.length === 0 ? (
        <p className="text-sm text-muted-foreground">No social media links added yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {socialMedia.map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <img 
                    src={item.social_media_outlet_types.icon_url} 
                    alt={item.social_media_outlet_types.name}
                    className="h-5 w-5"
                  />
                  {item.custom_name || item.social_media_outlet_types.name}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(item)}
                    disabled={updateMutation.isPending}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(item.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {item.handle && (
                  <p className="text-sm text-muted-foreground mb-2">
                    Handle: {item.handle}
                  </p>
                )}
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {item.link}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this social media link. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
