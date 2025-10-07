import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface ServiceAreaPagesProps {
  area: any;
}

const ServiceAreaPages = ({ area }: ServiceAreaPagesProps) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: pages, isLoading } = useQuery({
    queryKey: ['service-area-pages', area?.id],
    queryFn: async () => {
      if (!area?.id) return [];
      
      const { data, error } = await supabase
        .from('generated_pages')
        .select(`
          *,
          services (
            name,
            category
          )
        `)
        .eq('service_area_id', area.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!area?.id,
  });

  const filteredPages = pages?.filter(page => {
    if (categoryFilter !== 'all' && page.services?.category !== categoryFilter) return false;
    if (searchQuery && !page.services?.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

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
        <DialogTitle>Pages for {area?.city_name}</DialogTitle>
      </DialogHeader>

      <div className="flex gap-4 mb-4">
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

        <Input
          placeholder="Search services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
      </div>

      <div className="text-sm text-muted-foreground mb-4">
        Showing {filteredPages?.length || 0} of {pages?.length || 0} pages
      </div>

      {isLoading ? (
        <div>Loading pages...</div>
      ) : (
        <div className="border rounded-lg max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>URL Path</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPages?.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.services?.name}</TableCell>
                  <TableCell>
                    <Badge className={getCategoryBadge(page.services?.category || '')}>
                      {page.services?.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{page.url_path}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={page.status ? 'default' : 'secondary'}>
                      {page.status ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(page.url_path, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
};

export default ServiceAreaPages;