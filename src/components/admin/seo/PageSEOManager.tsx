import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Edit, ExternalLink } from 'lucide-react';
import { SEOMetaEditor } from './SEOMetaEditor';

export const PageSEOManager = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPage, setSelectedPage] = useState<any>(null);

  const { data: pages, isLoading } = useQuery({
    queryKey: ['pages-seo'],
    queryFn: async () => {
      const results: any[] = [];
      
      // Fetch static pages
      const staticQuery = await supabase
        .from('static_pages')
        .select('id, title, slug, created_at')
        .eq('is_published', true);

      // Fetch generated pages  
      const generatedQuery = await supabase
        .from('generated_pages')
        .select('id, page_title, url_path, created_at')
        .eq('status', true);

      // Fetch SEO data
      const seoQuery = await supabase.from('page_seo').select('*');
      
      const staticPages = staticQuery.data;
      const generatedPages = generatedQuery.data;
      const seoData = seoQuery.data;

      // Combine static pages
      staticPages?.forEach((p) => {
        const seo = seoData?.find((s) => s.page_type === 'static' && s.page_id === p.id);
        results.push({
          id: p.id,
          type: 'static',
          title: p.title,
          url: `/${p.slug}`,
          created_at: p.created_at,
          seo,
        });
      });

      // Combine generated pages
      generatedPages?.forEach((p) => {
        const seo = seoData?.find((s) => s.page_type === 'generated' && s.page_id === p.id);
        results.push({
          id: p.id,
          type: 'generated',
          title: p.page_title,
          url: p.url_path,
          created_at: p.created_at,
          seo,
        });
      });

      return results;
    },
  });

  const filteredPages = pages?.filter((page: any) =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedPage) {
    return <SEOMetaEditor page={selectedPage} onClose={() => setSelectedPage(null)} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Page SEO Manager</CardTitle>
        <CardDescription>Manage meta tags and SEO settings for all pages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pages by title or URL..."
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading pages...</div>
        ) : filteredPages && filteredPages.length > 0 ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page Title</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>SEO Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPages.map((page: any) => (
                  <TableRow key={`${page.type}-${page.id}`}>
                    <TableCell className="font-medium">{page.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{page.url}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{page.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {page.seo ? (
                        <Badge variant="default" className="bg-green-600">Optimized</Badge>
                      ) : (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedPage(page)}>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit SEO
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => window.open(page.url, '_blank')}>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No pages found</div>
        )}
      </CardContent>
    </Card>
  );
};
