import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ServiceToggleManagerProps {
  area: any;
  onClose: () => void;
}

const ServiceToggleManager = ({ area, onClose }: ServiceToggleManagerProps) => {
  const [changes, setChanges] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useQuery({
    queryKey: ['area-services', area?.id],
    queryFn: async () => {
      if (!area?.id) return [];
      
      // Get all services with their status for this area
      const { data: allServices, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .order('name');
      
      if (servicesError) throw servicesError;

      // Get junction table entries for this area
      const { data: junctionData, error: junctionError } = await supabase
        .from('service_area_services')
        .select('*')
        .eq('service_area_id', area.id);
      
      if (junctionError) throw junctionError;

      // Combine the data
      return allServices.map(service => {
        const junction = junctionData?.find(j => j.service_id === service.id);
        return {
          ...service,
          is_active: junction?.is_active ?? true,
          junction_id: junction?.id,
        };
      });
    },
    enabled: !!area?.id,
  });

  const updateServicesMutation = useMutation({
    mutationFn: async () => {
      if (Object.keys(changes).length === 0) return;

      for (const [serviceId, isActive] of Object.entries(changes)) {
        // Update junction table
        const { error: junctionError } = await supabase
          .from('service_area_services')
          .update({ is_active: isActive })
          .eq('service_area_id', area.id)
          .eq('service_id', serviceId);

        if (junctionError) throw junctionError;

        // Update generated_pages status
        const { error: pagesError } = await supabase
          .from('generated_pages')
          .update({ status: isActive })
          .eq('service_area_id', area.id)
          .eq('service_id', serviceId);

        if (pagesError) throw pagesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-areas'] });
      queryClient.invalidateQueries({ queryKey: ['area-services', area?.id] });
      toast({ title: `Services updated for ${area.city_name}` });
      setChanges({});
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating services',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleToggle = (serviceId: string, currentStatus: boolean) => {
    setChanges(prev => ({
      ...prev,
      [serviceId]: !currentStatus,
    }));
  };

  const getEffectiveStatus = (serviceId: string, originalStatus: boolean) => {
    return changes[serviceId] !== undefined ? changes[serviceId] : originalStatus;
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      'Authority Hub': 'bg-blue-500',
      'Emergency Services': 'bg-red-500',
      'Granular Services': 'bg-green-500',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Manage Services for {area?.city_name}</DialogTitle>
        <DialogDescription>
          Enable or disable specific services for this service area. Changes affect page visibility.
        </DialogDescription>
      </DialogHeader>

      {isLoading ? (
        <div>Loading services...</div>
      ) : (
        <>
          <div className="border rounded-lg max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services?.map((service) => {
                  const effectiveStatus = getEffectiveStatus(service.id, service.is_active);
                  const hasChange = changes[service.id] !== undefined;
                  
                  return (
                    <TableRow key={service.id} className={hasChange ? 'bg-muted/50' : ''}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>
                        <Badge className={getCategoryBadge(service.category)}>
                          {service.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={effectiveStatus}
                            onCheckedChange={() => handleToggle(service.id, service.is_active)}
                          />
                          <span className="text-sm text-muted-foreground">
                            {effectiveStatus ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              {Object.keys(changes).length > 0 && (
                <span className="text-orange-600 font-medium">
                  {Object.keys(changes).length} unsaved change(s)
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={() => updateServicesMutation.mutate()}
                disabled={Object.keys(changes).length === 0 || updateServicesMutation.isPending}
              >
                {updateServicesMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ServiceToggleManager;