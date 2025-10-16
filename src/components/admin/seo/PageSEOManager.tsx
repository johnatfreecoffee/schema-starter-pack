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
import { Search, Edit, ExternalLink, Sparkles } from 'lucide-react';
import { SEOMetaEditor } from './SEOMetaEditor';
import AIPageEditor from '../ai-editor/AIPageEditor';
import { useToast } from '@/hooks/use-toast';

export const PageSEOManager = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [showAIEditor, setShowAIEditor] = useState(false);
  const [aiEditingPage, setAiEditingPage] = useState<any>(null);
  const { toast } = useToast();

  const { data: pages, isLoading, refetch } = useQuery({
    queryKey: ['pages-seo'],
    queryFn: async () => {
      const results: any[] = [];

      // Fetch static pages
      // @ts-ignore
      const staticPagesQuery = supabase.from('static_pages').select('id, title, slug, created_at, content_html');
      // @ts-ignore
      const staticPagesResult = await staticPagesQuery.eq('status', true);
      const staticPages = staticPagesResult.data;

      // Fetch generated pages
      // @ts-ignore
      const generatedPagesQuery = supabase.from('generated_pages').select('id, page_title, url_path, created_at, rendered_html');
      // @ts-ignore
      const generatedPagesResult = await generatedPagesQuery.eq('status', true);
      const generatedPages = generatedPagesResult.data;

      // Fetch SEO data
      const seoResult = await supabase.from('page_seo').select('*');
      const seoData = seoResult.data;

      // Process static pages
      if (staticPages) {
        for (const page of staticPages) {
          const seo = seoData?.find((s: any) => s.page_type === 'static' && s.page_id === page.id);
          results.push({
            id: page.id,
            type: 'static',
            title: page.title,
            url: `/${page.slug}`,
            created_at: page.created_at,
            content: page.content_html,
            seo: seo || null
          });
        }
      }

      // Process generated pages
      if (generatedPages) {
        for (const page of generatedPages) {
          const seo = seoData?.find((s: any) => s.page_type === 'generated' && s.page_id === page.id);
          results.push({
            id: page.id,
            type: 'generated',
            title: page.page_title,
            url: page.url_path,
            created_at: page.created_at,
            content: page.rendered_html,
            seo: seo || null
          });
        }
      }

      return results;
    }
  });

  const filteredPages = pages?.filter((page: any) =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditWithAI = (page: any) => {
    setAiEditingPage(page);
    setShowAIEditor(true);
  };

  const handleSaveAIEdits = async (content: string) => {
    if (!aiEditingPage) return;

    try {
      const table = aiEditingPage.type === 'static' ? 'static_pages' : 'generated_pages';
      const field = aiEditingPage.type === 'static' ? 'content_html' : 'rendered_html';

      const { error } = await supabase
        .from(table)
        .update({ [field]: content })
        .eq('id', aiEditingPage.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Page content updated successfully',
      });

      refetch();
    } catch (error) {
      console.error('Save error:', error);
      throw error;
    }
  };

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
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditWithAI(page)}
                          disabled={!page.content}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Edit with AI
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

      {showAIEditor && aiEditingPage && (
        <AIPageEditor
          open={showAIEditor}
          onClose={() => {
            setShowAIEditor(false);
            setAiEditingPage(null);
          }}
          pageId={aiEditingPage.id}
          pageType={aiEditingPage.type}
          initialContent={aiEditingPage.content || ''}
          pageTitle={aiEditingPage.title}
          onSave={handleSaveAIEdits}
        />
      )}
    </Card>
  );
};
