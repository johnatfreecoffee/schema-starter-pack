import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  ExternalLink, 
  FileText, 
  Globe, 
  Archive,
  ChevronDown,
  ChevronRight,
  Layers,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface PageNode {
  id: string;
  type: 'static' | 'generated';
  title: string;
  url: string;
  status: 'active' | 'archived';
  service?: string;
  area?: string;
  meta_description?: string;
  category?: string;
}

const SitemapPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  // Fetch static pages
  const { data: staticPages } = useQuery({
    queryKey: ['static-pages-sitemap'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('static_pages')
        .select('id, title, slug, status')
        .order('title');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch generated pages with relationships
  const { data: generatedPages } = useQuery({
    queryKey: ['generated-pages-sitemap'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_pages')
        .select(`
          id,
          page_title,
          url_path,
          status,
          meta_description,
          services (
            name,
            archived,
            category
          ),
          service_areas (
            city_name,
            archived
          )
        `)
        .order('url_path');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Transform data into page nodes
  const allPages: PageNode[] = [
    ...(staticPages?.map(page => ({
      id: `static-${page.id}`,
      type: 'static' as const,
      title: page.title,
      url: `/${page.slug}`,
      status: page.status ? 'active' as const : 'archived' as const,
    })) || []),
    ...(generatedPages?.map(page => ({
      id: `generated-${page.id}`,
      type: 'generated' as const,
      title: page.page_title,
      url: page.url_path,
      status: (page.services?.archived || page.service_areas?.archived) 
        ? 'archived' as const 
        : (page.status ? 'active' as const : 'archived' as const),
      service: page.services?.name,
      area: page.service_areas?.city_name,
      meta_description: page.meta_description,
      category: page.services?.category,
    })) || []),
  ];

  // Filter pages
  const filteredPages = allPages.filter(page => {
    return page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.service?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.area?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Group pages by service and category
  const groupedTemplatePages = React.useMemo(() => {
    const pages = filteredPages.filter(p => p.type === 'generated');
    const grouped = new Map<string, Map<string, PageNode[]>>();
    
    pages.forEach(page => {
      const category = page.category || 'Other';
      const service = page.service || 'Unknown';
      
      if (!grouped.has(category)) {
        grouped.set(category, new Map());
      }
      
      const categoryMap = grouped.get(category)!;
      if (!categoryMap.has(service)) {
        categoryMap.set(service, []);
      }
      
      categoryMap.get(service)!.push(page);
    });
    
    return grouped;
  }, [filteredPages]);

  // Calculate stats
  const stats = {
    total: allPages.length,
    active: allPages.filter(p => p.status === 'active').length,
    archived: allPages.filter(p => p.status === 'archived').length,
    static: allPages.filter(p => p.type === 'static').length,
    generated: allPages.filter(p => p.type === 'generated').length,
    staticActive: allPages.filter(p => p.type === 'static' && p.status === 'active').length,
    generatedActive: allPages.filter(p => p.type === 'generated' && p.status === 'active').length,
  };

  const categoryIcons = {
    'Granular Services': Layers,
    'Emergency Services': Zap,
    'Authority Hub': AlertTriangle,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Interactive Site Map</h1>
        <p className="text-muted-foreground">
          Visual overview of all pages with real-time status and organization
        </p>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-primary">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total Pages</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-500">{stats.active}</div>
          <div className="text-xs text-muted-foreground">Active</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-muted-foreground">{stats.archived}</div>
          <div className="text-xs text-muted-foreground">Archived</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-accent">{stats.static}</div>
          <div className="text-xs text-muted-foreground">Static Pages</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-primary">{stats.generated}</div>
          <div className="text-xs text-muted-foreground">Generated</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-accent">{stats.staticActive}</div>
          <div className="text-xs text-muted-foreground">Static Active</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-primary">{stats.generatedActive}</div>
          <div className="text-xs text-muted-foreground">Generated Active</div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pages by title, URL, service, or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Main Content */}
      <Card className="p-6">
        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="templates">
              Templates ({filteredPages.filter(p => p.type === 'generated').length})
            </TabsTrigger>
            <TabsTrigger value="static">
              Static Pages ({filteredPages.filter(p => p.type === 'static').length})
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            {Array.from(groupedTemplatePages.entries()).map(([category, services]) => {
              const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons] || Layers;
              const totalPages = Array.from(services.values()).reduce((sum, pages) => sum + pages.length, 0);
              const uniqueAreas = new Set(
                Array.from(services.values())
                  .flat()
                  .map(page => page.area)
                  .filter(Boolean)
              ).size;
              const isCategoryOpen = openCategories.has(category);
              
              return (
                <Card key={category} className="overflow-hidden">
                  <Collapsible
                    open={isCategoryOpen}
                    onOpenChange={(open) => {
                      const newOpen = new Set(openCategories);
                      if (open) {
                        newOpen.add(category);
                      } else {
                        newOpen.delete(category);
                      }
                      setOpenCategories(newOpen);
                    }}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="p-4 bg-muted/50 border-b hover:bg-muted/70 transition-colors">
                        <div className="flex items-center gap-3">
                          {isCategoryOpen ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <CategoryIcon className="h-5 w-5 text-primary" />
                          <div className="text-left">
                            <h3 className="font-semibold">{category}</h3>
                            <p className="text-sm text-muted-foreground">
                              {services.size} {services.size === 1 ? 'service' : 'services'} × {uniqueAreas} {uniqueAreas === 1 ? 'area' : 'areas'} = {totalPages} {totalPages === 1 ? 'page' : 'pages'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="divide-y">
                        {Array.from(services.entries()).map(([service, pages]) => (
                          <Collapsible key={service}>
                            <CollapsibleTrigger className="w-full p-4 hover:bg-muted/50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                                  <Globe className="h-4 w-4 text-muted-foreground" />
                                  <div className="text-left">
                                    <div className="font-medium">{service}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {pages.length} {pages.length === 1 ? 'page' : 'pages'}
                                      {pages.filter(p => p.status === 'active').length < pages.length && (
                                        <span className="ml-2">
                                          • {pages.filter(p => p.status === 'archived').length} archived
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={
                                    pages.every(p => p.status === 'active') ? 'default' : 'secondary'
                                  }>
                                    {pages.filter(p => p.status === 'active').length} active
                                  </Badge>
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="px-4 py-2 bg-muted/20 space-y-1">
                                {pages.map(page => (
                                  <div
                                    key={page.id}
                                    className="flex items-center justify-between py-2 px-3 rounded hover:bg-background transition-colors group"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium truncate">
                                          {page.area}
                                        </span>
                                        {page.status === 'archived' && (
                                          <Archive className="h-3 w-3 text-muted-foreground" />
                                        )}
                                      </div>
                                      <div className="text-xs text-muted-foreground font-mono truncate">
                                        {page.url}
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                                      asChild
                                    >
                                      <a href={page.url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </TabsContent>

          {/* Static Pages Tab */}
          <TabsContent value="static" className="space-y-3">
            {filteredPages
              .filter(page => page.type === 'static')
              .map(page => (
                <div
                  key={page.id}
                  className={`
                    p-4 rounded-lg border transition-all
                    hover:shadow-md hover:border-accent
                    ${page.status === 'archived' 
                      ? 'opacity-50 border-dashed' 
                      : 'border-border'
                    }
                  `}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-accent flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{page.title}</div>
                        <div className="text-sm text-muted-foreground font-mono truncate">
                          {page.url}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {page.status === 'archived' && (
                        <Badge variant="secondary">
                          <Archive className="h-3 w-3 mr-1" />
                          Archived
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a href={page.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default SitemapPage;
