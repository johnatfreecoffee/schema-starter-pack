import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Edit2, Eye, ExternalLink, Sparkles } from 'lucide-react';
import LocalContentEditor from '@/components/admin/settings/page-management/LocalContentEditor';
import { Card } from '@/components/ui/card';

const PageManagement = () => {
  const [filterService, setFilterService] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [filterContent, setFilterContent] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all pages with service and area data
  const { data: pages, isLoading } = useQuery({
    queryKey: ['generated-pages-management'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_pages')
        .select(`
          *,
          services:service_id (
            id,
            name,
            slug,
            description
          ),
          service_areas:service_area_id (
            id,
            city_name,
            city_slug,
            display_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch service_area_services data separately for each page
      const pagesWithContent = await Promise.all(
        (data || []).map(async (page) => {
          const { data: sasData } = await supabase
            .from('service_area_services')
            .select('*')
            .eq('service_id', page.service_id)
            .eq('service_area_id', page.service_area_id)
            .single();

          return {
            ...page,
            service_area_services: sasData ? [sasData] : [],
          };
        })
      );

      return pagesWithContent;
    },
  });

  // Fetch services for filter
  const { data: services } = useQuery({
    queryKey: ['services-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch areas for filter
  const { data: areas } = useQuery({
    queryKey: ['service-areas-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_areas')
        .select('id, city_name')
        .order('city_name');
      if (error) throw error;
      return data;
    },
  });

  const togglePageStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
      const { error } = await supabase
        .from('generated_pages')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-pages-management'] });
      toast({ title: 'Page status updated' });
    },
  });

  // Filter pages
  const filteredPages = pages?.filter(page => {
    if (filterService !== 'all' && page.service_id !== filterService) return false;
    if (filterArea !== 'all' && page.service_area_id !== filterArea) return false;
    
    const hasContent = !!page.service_area_services?.[0]?.local_description;
    if (filterContent === 'has-content' && !hasContent) return false;
    if (filterContent === 'needs-content' && hasContent) return false;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const serviceName = (page.services as any)?.name?.toLowerCase() || '';
      const cityName = (page.service_areas as any)?.city_name?.toLowerCase() || '';
      const url = page.url_path?.toLowerCase() || '';
      if (!serviceName.includes(search) && !cityName.includes(search) && !url.includes(search)) {
        return false;
      }
    }

    return true;
  });

  const stats = {
    total: pages?.length || 0,
    active: pages?.filter(p => p.status).length || 0,
    withContent: pages?.filter(p => !!p.service_area_services?.[0]?.local_description).length || 0,
    needsContent: pages?.filter(p => !p.service_area_services?.[0]?.local_description).length || 0,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2">Page Management</h1>
        <p className="text-muted-foreground">
          Managing {services?.length || 0} services × {areas?.length || 0} areas = {stats.total} total pages
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Pages</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-muted-foreground">Active Pages</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.withContent}</div>
          <div className="text-sm text-muted-foreground">Has Local Content</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">{stats.needsContent}</div>
          <div className="text-sm text-muted-foreground">Needs Content</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <Select value={filterService} onValueChange={setFilterService}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {services?.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterArea} onValueChange={setFilterArea}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Areas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            {areas?.map(a => (
              <SelectItem key={a.id} value={a.id}>{a.city_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterContent} onValueChange={setFilterContent}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Content Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pages</SelectItem>
            <SelectItem value="has-content">Has Local Content</SelectItem>
            <SelectItem value="needs-content">Needs Content</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Search pages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
        />
      </div>

      {/* Pages Table */}
      {isLoading ? (
        <div>Loading pages...</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Local Content</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPages?.map((page) => {
                const service = page.services as any;
                const area = page.service_areas as any;
                const content = page.service_area_services?.[0];
                const hasContent = !!content?.local_description;

                return (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium">{service?.name}</TableCell>
                    <TableCell>{area?.city_name}</TableCell>
                    <TableCell>
                      <a 
                        href={page.url_path} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {page.url_path}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant={hasContent ? 'default' : 'secondary'}>
                        {hasContent ? '✓ Has Content' : 'Needs Content'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={page.status}
                        onCheckedChange={(checked) =>
                          togglePageStatusMutation.mutate({ id: page.id, status: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPage({
                              ...page,
                              service,
                              area,
                              content,
                            });
                            setIsEditorOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit Content
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(page.url_path, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Content Editor Dialog */}
      {selectedPage && (
        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <LocalContentEditor
              serviceId={selectedPage.service_id}
              areaId={selectedPage.service_area_id}
              service={selectedPage.service}
              area={selectedPage.area}
              onClose={() => {
                setIsEditorOpen(false);
                setSelectedPage(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PageManagement;
