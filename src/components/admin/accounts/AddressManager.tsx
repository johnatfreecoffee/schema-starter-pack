import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AddressForm } from './AddressForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, MapPin, Edit, Trash2, Star } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface AddressManagerProps {
  entityType: 'account' | 'contact';
  entityId: string;
}

export const AddressManager = ({ entityType, entityId }: AddressManagerProps) => {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  useEffect(() => {
    fetchAddresses();
  }, [entityType, entityId]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
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

  const handleDelete = async (address: any) => {
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', address.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Address deleted successfully'
      });

      fetchAddresses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const formatAddress = (address: any) => {
    const parts = [
      address.street_1,
      address.street_2,
      address.city,
      `${address.state} ${address.zip}`,
      address.country !== 'United States' ? address.country : null
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Addresses</h3>
        <Button onClick={() => {
          setEditingAddress(null);
          setShowAddressForm(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Address
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading addresses...</div>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No addresses added yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id} className={address.is_primary ? 'border-primary' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="capitalize">{address.address_type}</span>
                    {address.label && (
                      <span className="text-sm text-muted-foreground">({address.label})</span>
                    )}
                  </div>
                  {address.is_primary && (
                    <Star className="h-4 w-4 text-primary fill-primary" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {formatAddress(address)}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingAddress(address);
                      setShowAddressForm(true);
                    }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Address</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this address? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(address)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddressForm
        open={showAddressForm}
        onOpenChange={setShowAddressForm}
        entityType={entityType}
        entityId={entityId}
        address={editingAddress}
        onSuccess={fetchAddresses}
      />
    </div>
  );
};
