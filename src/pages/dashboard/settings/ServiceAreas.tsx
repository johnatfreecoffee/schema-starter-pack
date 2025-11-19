import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cacheInvalidation } from '@/lib/cacheInvalidation';
import { useState } from 'react';
import { Eye, Pencil, Archive, Plus, LayoutGrid, List, Settings, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ServiceAreaForm from '@/components/admin/settings/service-areas/ServiceAreaForm';
import ServiceAreaPages from '@/components/admin/settings/service-areas/ServiceAreaPages';
import ServiceToggleManager from '@/components/admin/settings/service-areas/ServiceToggleManager';

const ServiceAreas = () => {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [archiveTab, setArchiveTab] = useState<'active' | 'archived'>('active');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPagesOpen, setIsPagesOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: serviceAreas, isLoading } = useQuery({
    queryKey: ['service-areas'],
    queryFn: async () => {
      const query = supabase
        .from('service_areas')
        .select(`
          *,
          generated_pages (
            id,
            services (
              id,
              archived
            )
          ),
          service_area_services (
            is_active,
            services (
              id,
              archived
            )
          )
        `)
        .order('city_name', { ascending: true });
      
      const { data, error } = await query;
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

      if (status) {
        // When turning ON, only activate pages where the service is NOT archived
        const { data: pages } = await supabase
          .from('generated_pages')
          .select('id, service_id, services!inner(archived)')
          .eq('service_area_id', id);
        
        if (pages) {
          for (const page of pages) {
            const serviceIsArchived = (page.services as any).archived;
            // Only activate if service is not archived
            await supabase
              .from('generated_pages')
              .update({ status: !serviceIsArchived })
              .eq('id', page.id);
          }
        }
      } else {
        // When turning OFF, deactivate all pages for this area
        await supabase
          .from('generated_pages')
          .update({ status: false })
          .eq('service_area_id', id);
      }
    },
    onSuccess: async (_, variables) => {
      await cacheInvalidation.invalidateServiceArea(variables.id);
      queryClient.invalidateQueries({ queryKey: ['service-areas'] });
      queryClient.invalidateQueries({ queryKey: ['generated-pages'] });
      toast({ title: 'Area status updated' });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('service_areas')
        .update({ 
          archived: true, 
          archived_at: new Date().toISOString(),
          archived_by: user?.id 
        })
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: async (archivedId) => {
      await cacheInvalidation.invalidateServiceArea(archivedId);
      queryClient.invalidateQueries({ queryKey: ['service-areas'] });
      toast({ title: 'Service area archived successfully' });
      setArchiveDialogOpen(false);
    },
  });

  const updateDefaultMutation = useMutation({
    mutationFn: async ({ id, isDefault }: { id: string; isDefault: boolean }) => {
      if (isDefault) {
        // First, unset any existing default
        const { error: unsetError } = await supabase
          .from('service_areas')
          .update({ is_default: false })
          .eq('is_default', true)
          .neq('id', id);
        
        if (unsetError) throw unsetError;
      }

      // Then set the new default
      const { error } = await supabase
        .from('service_areas')
        .update({ is_default: isDefault })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['service-areas'] });
      toast({ title: 'Default area updated' });
    },
  });

  const filteredAreas = serviceAreas?.filter(area => {
    // Filter by archive tab
    if (archiveTab === 'active' && area.archived) return false;
    if (archiveTab === 'archived' && !area.archived) return false;
    
    // Filter by status
    if (statusFilter === 'active' && !area.status) return false;
    if (statusFilter === 'inactive' && area.status) return false;
    
    // Filter by search query
    if (searchQuery && !area.city_name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !area.display_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getServicesCount = (area: any) => {
    if (!area) return '0/0';
    // Filter out archived services
    const nonArchivedServices = area.service_area_services?.filter((s: any) => 
      !s.services?.archived
    ) || [];
    
    const total = nonArchivedServices.length;
    const active = nonArchivedServices.filter((s: any) => s.is_active).length;
    return `${active}/${total}`;
  };

  const getPagesCount = (area: any) => {
    if (!area) return 0;
    // Count pages only for non-archived services
    const nonArchivedPages = area.generated_pages?.filter((p: any) => 
      !p.services?.archived
    ) || [];
    return nonArchivedPages.length;
  };

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">Service Areas Management</h1>
          <Button onClick={() => { setSelectedArea(null); setIsFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Service Area
          </Button>
        </div>

        <div className="flex gap-4 mb-6 flex-wrap">
          <Tabs value={archiveTab} onValueChange={(value) => setArchiveTab(value as 'active' | 'archived')}>
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>
          </Tabs>

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
                  <TableHead>City</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Pages</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAreas?.map((area) => (
                  <TableRow key={area.id} className={area.archived ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">
                      {area.city_name}
                      {area.archived && <span className="ml-2 text-xs text-muted-foreground">(Archived)</span>}
                    </TableCell>
                    <TableCell>{area.state}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getPagesCount(area)} pages</Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={area.status}
                        onCheckedChange={(checked) => updateStatusMutation.mutate({ id: area.id, status: checked })}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={area.is_default || false}
                        onCheckedChange={(checked) => updateDefaultMutation.mutate({ id: area.id, isDefault: checked })}
                        disabled={area.archived}
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
                        {!area.archived && (
                          <>
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
                              onClick={() => { setSelectedArea(area); setArchiveDialogOpen(true); }}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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
              <div key={area.id} className={`border rounded-lg p-4 hover:shadow-lg transition-shadow ${area.archived ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{area.city_name}</h3>
                    {area.archived && <span className="text-xs text-muted-foreground">(Archived)</span>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {area.state}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Active</span>
                      <Switch
                        checked={area.status}
                        onCheckedChange={(checked) => updateStatusMutation.mutate({ id: area.id, status: checked })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Default</span>
                      <Switch
                        checked={area.is_default || false}
                        onCheckedChange={(checked) => updateDefaultMutation.mutate({ id: area.id, isDefault: checked })}
                        disabled={area.archived}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mb-3">
                  <Badge variant="secondary">{getPagesCount(area)} pages</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedArea(area); setIsPagesOpen(true); }} title="View Pages">
                    <FileText className="h-4 w-4" />
                  </Button>
                  {!area.archived && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedArea(area); setIsServicesOpen(true); }} title="Manage Services">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedArea(area); setIsFormOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedArea(area); setArchiveDialogOpen(true); }}>
                        <Archive className="h-4 w-4" />
                      </Button>
                    </>
                  )}
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

        <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive Service Area</AlertDialogTitle>
              <AlertDialogDescription>
                Archive "{selectedArea?.city_name}"? This will hide the service area and its {getPagesCount(selectedArea)} generated pages. You can restore it later by showing archived areas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => selectedArea && archiveMutation.mutate(selectedArea.id)}>
                Archive
              </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ServiceAreas;
