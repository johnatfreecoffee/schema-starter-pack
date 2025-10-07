import AdminLayout from '@/components/layout/AdminLayout';
import SettingsTabs from '@/components/layout/SettingsTabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Eye, Pencil, Trash2, Plus, LayoutGrid, List, Settings, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ServiceAreaForm from '@/components/admin/settings/service-areas/ServiceAreaForm';
import ServiceAreaPages from '@/components/admin/settings/service-areas/ServiceAreaPages';
import ServiceToggleManager from '@/components/admin/settings/service-areas/ServiceToggleManager';

const ServiceAreas = () => {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPagesOpen, setIsPagesOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: serviceAreas, isLoading } = useQuery({
    queryKey: ['service-areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_areas')
        .select(`
          *,
          generated_pages (count),
          service_area_services (
            count,
            is_active
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
      // Update area status
      const { error: areaError } = await supabase
        .from('service_areas')
        .update({ status })
        .eq('id', id);
      
      if (areaError) throw areaError;

      // Update all generated pages for this area
      const { error: pagesError } = await supabase
        .from('generated_pages')
        .update({ status })
        .eq('service_area_id', id);
      
      if (pagesError) throw pagesError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-areas'] });
      toast({ title: 'Area status updated' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_areas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-areas'] });
      toast({ title: 'Service area deleted successfully' });
      setDeleteDialogOpen(false);
    },
  });

  const filteredAreas = serviceAreas?.filter(area => {
    if (statusFilter === 'active' && !area.status) return false;
    if (statusFilter === 'inactive' && area.status) return false;
    if (searchQuery && !area.city_name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !area.display_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getServicesCount = (area: any) => {
    const total = area.service_area_services?.length || 0;
    const active = area.service_area_services?.filter((s: any) => s.is_active).length || 0;
    return `${active}/${total}`;
  };

  return (
    <AdminLayout>
      <SettingsTabs />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">Service Areas Management</h1>
          <Button onClick={() => { setSelectedArea(null); setIsFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Service Area
          </Button>
        </div>

        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Search areas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : viewMode === 'table' ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>City Name</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Pages</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAreas?.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell className="font-medium">{area.city_name}</TableCell>
                    <TableCell>{area.display_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{area.generated_pages?.[0]?.count || 0} pages</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getServicesCount(area)} services</Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={area.status}
                        onCheckedChange={(checked) => updateStatusMutation.mutate({ id: area.id, status: checked })}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedArea(area); setIsPagesOpen(true); }}
                          title="View Pages"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedArea(area); setIsServicesOpen(true); }}
                          title="Manage Services"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedArea(area); setIsFormOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedArea(area); setDeleteDialogOpen(true); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAreas?.map((area) => (
              <div key={area.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{area.city_name}</h3>
                    <p className="text-sm text-muted-foreground">{area.display_name}</p>
                  </div>
                  <Switch
                    checked={area.status}
                    onCheckedChange={(checked) => updateStatusMutation.mutate({ id: area.id, status: checked })}
                  />
                </div>
                <div className="flex gap-2 mb-3">
                  <Badge variant="secondary">{area.generated_pages?.[0]?.count || 0} pages</Badge>
                  <Badge variant="outline">{getServicesCount(area)} services</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedArea(area); setIsPagesOpen(true); }} title="View Pages">
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedArea(area); setIsServicesOpen(true); }} title="Manage Services">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedArea(area); setIsFormOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedArea(area); setDeleteDialogOpen(true); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedArea ? 'Edit Service Area' : 'Create New Service Area'}</DialogTitle>
              <DialogDescription>
                {selectedArea ? 'Update service area details' : 'Add a new geographic service area'}
              </DialogDescription>
            </DialogHeader>
            <ServiceAreaForm
              area={selectedArea}
              onSuccess={() => {
                setIsFormOpen(false);
                setSelectedArea(null);
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isPagesOpen} onOpenChange={setIsPagesOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh]">
            <ServiceAreaPages area={selectedArea} />
          </DialogContent>
        </Dialog>

        <Dialog open={isServicesOpen} onOpenChange={setIsServicesOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <ServiceToggleManager 
              area={selectedArea}
              onClose={() => setIsServicesOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Service Area</AlertDialogTitle>
              <AlertDialogDescription>
                Delete "{selectedArea?.city_name}"? This will also delete all {selectedArea?.generated_pages?.[0]?.count || 0} generated pages and service configurations.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => selectedArea && deleteMutation.mutate(selectedArea.id)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default ServiceAreas;
