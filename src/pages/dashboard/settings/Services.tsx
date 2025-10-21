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
import { Eye, Pencil, Archive, Plus, LayoutGrid, List, FileEdit, ArchiveRestore } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ServiceForm from '@/components/admin/settings/services/ServiceForm';
import ServicePreview from '@/components/admin/settings/services/ServicePreview';
import ServiceTemplateEditor from '@/components/admin/settings/services/ServiceTemplateEditor';
import { cacheInvalidation } from '@/lib/cacheInvalidation';

const ServicesSettings = () => {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useQuery({
    queryKey: ['services', showArchived],
    queryFn: async () => {
      let query = supabase
        .from('services')
        .select(`
          *,
          templates:template_id (name, template_type),
          generated_pages (count)
        `);
      
      if (!showArchived) {
        query = query.eq('archived', false);
      }
      
      query = query.order('is_active', { ascending: false })
        .order('name', { ascending: true });
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error: serviceError } = await supabase
        .from('services')
        .update({ is_active })
        .eq('id', id);
      
      if (serviceError) throw serviceError;

      if (is_active) {
        // When turning ON, only activate pages where the area is also active
        const { data: pages } = await supabase
          .from('generated_pages')
          .select('id, service_area_id, service_areas!inner(status)')
          .eq('service_id', id);
        
        if (pages) {
          for (const page of pages) {
            const areaIsActive = (page.service_areas as any).status;
            await supabase
              .from('generated_pages')
              .update({ status: areaIsActive })
              .eq('id', page.id);
          }
        }
      } else {
        // When turning OFF, deactivate all pages for this service
        await supabase
          .from('generated_pages')
          .update({ status: false })
          .eq('service_id', id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['generated-pages'] });
      toast({ title: 'Service status updated' });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('services')
        .update({ 
          archived: true, 
          archived_at: new Date().toISOString(),
          archived_by: user?.id 
        })
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: async (archivedServiceId) => {
      await cacheInvalidation.invalidateService(archivedServiceId);
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ title: 'Service archived successfully' });
      setArchiveDialogOpen(false);
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('services')
        .update({ 
          archived: false, 
          archived_at: null,
          archived_by: null 
        })
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: async (unarchivedServiceId) => {
      await cacheInvalidation.invalidateService(unarchivedServiceId);
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ title: 'Service restored successfully' });
    },
  });

  const getCategoryBadge = (category: string) => {
    const colors = {
      'Authority Hub': 'bg-blue-500',
      'Emergency Services': 'bg-red-500',
      'Granular Services': 'bg-green-500',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const filteredServices = services?.filter(service => {
    if (categoryFilter !== 'all' && service.category !== categoryFilter) return false;
    if (searchQuery && !service.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activeFilter === 'active' && !service.is_active) return false;
    if (activeFilter === 'inactive' && service.is_active) return false;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">Services Management</h1>
          <Button onClick={() => { setSelectedService(null); setIsFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Service
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

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Authority Hub">Authority Hub</SelectItem>
              <SelectItem value="Emergency Services">Emergency Services</SelectItem>
              <SelectItem value="Granular Services">Granular Services</SelectItem>
            </SelectContent>
          </Select>

          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={showArchived ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </Button>

          <Input
            placeholder="Search services..."
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
                  <TableHead>Service Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Starting Price</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Pages</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices?.map((service) => (
                  <TableRow key={service.id} className={!service.is_active || service.archived ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">
                      {service.name}
                      {service.archived && <span className="ml-2 text-xs text-muted-foreground">(Archived)</span>}
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryBadge(service.category)}>
                        {service.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-green-600 font-semibold">
                      {service.starting_price ? formatPrice(service.starting_price) : 'N/A'}
                    </TableCell>
                    <TableCell>{service.templates?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{service.generated_pages?.[0]?.count || 0} pages</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={service.is_active}
                          onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: service.id, is_active: checked })}
                        />
                        <span className="text-sm">{service.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedService(service); setIsPreviewOpen(true); }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!service.archived ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setSelectedService(service); setIsTemplateEditorOpen(true); }}
                              title="Edit Page Template"
                            >
                              <FileEdit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setSelectedService(service); setIsFormOpen(true); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setSelectedService(service); setArchiveDialogOpen(true); }}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => unarchiveMutation.mutate(service.id)}
                            title="Restore service"
                          >
                            <ArchiveRestore className="h-4 w-4" />
                          </Button>
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
            {filteredServices?.map((service) => (
              <div key={service.id} className={`border rounded-lg p-4 hover:shadow-lg transition-shadow ${!service.is_active || service.archived ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{service.name}</h3>
                    {service.archived && <span className="text-xs text-muted-foreground">(Archived)</span>}
                  </div>
                  <Badge className={getCategoryBadge(service.category)}>
                    {service.category}
                  </Badge>
                </div>
                <p className="text-green-600 font-semibold mb-2">
                  {service.starting_price ? formatPrice(service.starting_price) : 'N/A'}
                </p>
                <div className="flex justify-between items-center mb-3">
                  <Badge variant="secondary">{service.generated_pages?.[0]?.count || 0} pages</Badge>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={service.is_active}
                      onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: service.id, is_active: checked })}
                    />
                    <span className="text-xs">{service.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedService(service); setIsPreviewOpen(true); }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {!service.archived ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedService(service); setIsTemplateEditorOpen(true); }} title="Edit Page Template">
                        <FileEdit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedService(service); setIsFormOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedService(service); setArchiveDialogOpen(true); }}>
                        <Archive className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => unarchiveMutation.mutate(service.id)} title="Restore service">
                      <ArchiveRestore className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedService ? 'Edit Service' : 'Create New Service'}</DialogTitle>
              <DialogDescription>
                {selectedService ? 'Update service details' : 'Add a new service offering'}
              </DialogDescription>
            </DialogHeader>
            <ServiceForm
              service={selectedService}
              onSuccess={() => {
                setIsFormOpen(false);
                setSelectedService(null);
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh]">
            <ServicePreview service={selectedService} />
          </DialogContent>
        </Dialog>

        <Dialog open={isTemplateEditorOpen} onOpenChange={setIsTemplateEditorOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Page Template for {selectedService?.name}</DialogTitle>
              <DialogDescription>
                Customize the HTML template used for all {selectedService?.name} pages. Use variables like {`{{service_name}}`}, {`{{city_name}}`}, and {`{{company_phone}}`} to make content dynamic.
              </DialogDescription>
            </DialogHeader>
            <ServiceTemplateEditor
              service={selectedService}
              onClose={() => {
                setIsTemplateEditorOpen(false);
                setSelectedService(null);
              }}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive Service</AlertDialogTitle>
              <AlertDialogDescription>
                Archive "{selectedService?.name}"? This will hide the service and its {selectedService?.generated_pages?.[0]?.count || 0} generated pages. You can restore it later by showing archived services.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => selectedService && archiveMutation.mutate(selectedService.id)}>
                Archive
              </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ServicesSettings;
