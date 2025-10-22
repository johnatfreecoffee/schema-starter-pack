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
  Sparkles,
  LayoutGrid,
  List
} from 'lucide-react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

interface PageNode {
  id: string;
  type: 'static' | 'generated';
  title: string;
  url: string;
  status: 'active' | 'archived';
  service?: string;
  area?: string;
  meta_description?: string;
}

const SitemapPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('list'); // Default to list view for better UX with many pages
  const [layoutMode, setLayoutMode] = useState<'hierarchical' | 'force' | 'circular'>('hierarchical');
  const [graphPageLimit, setGraphPageLimit] = useState(50);

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
            archived
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
    })) || []),
  ];

  // Filter pages
  const filteredPages = allPages.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.service?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.area?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // Limit pages shown in graph view for performance
  const graphPages = React.useMemo(() => {
    return filteredPages.slice(0, graphPageLimit);
  }, [filteredPages, graphPageLimit]);

  // Create nodes for React Flow
  const createNodes = React.useCallback((): Node[] => {
    const nodes: Node[] = [];
    
    const staticPages = graphPages.filter(p => p.type === 'static');
    const generatedPages = graphPages.filter(p => p.type === 'generated');
    
    // Calculate grid layout dimensions
    const columns = 3;
    const nodeWidth = 250;
    const nodeHeight = 120;
    const horizontalSpacing = 300;
    const verticalSpacing = 150;
    
    // Root node (centered)
    nodes.push({
      id: 'root',
      type: 'input',
      data: { label: '🏠 Home' },
      position: { x: horizontalSpacing * (columns / 2), y: 0 },
      style: {
        background: 'hsl(var(--primary))',
        color: 'hsl(var(--primary-foreground))',
        border: '2px solid hsl(var(--primary))',
        borderRadius: '12px',
        padding: '16px',
        fontSize: '16px',
        fontWeight: 'bold',
        minWidth: `${nodeWidth}px`,
      },
    });

    // Static pages group
    if (staticPages.length > 0) {
      nodes.push({
        id: 'static-group',
        type: 'default',
        data: { label: `📄 Static Pages (${staticPages.length})` },
        position: { x: horizontalSpacing, y: verticalSpacing },
        style: {
          background: 'hsl(var(--muted))',
          border: '2px solid hsl(var(--border))',
          borderRadius: '12px',
          padding: '12px',
          fontWeight: 'bold',
          minWidth: `${nodeWidth}px`,
        },
      });
    }

    // Generated pages group
    if (generatedPages.length > 0) {
      nodes.push({
        id: 'generated-group',
        type: 'default',
        data: { label: `🔄 Generated Pages (${generatedPages.length})` },
        position: { x: horizontalSpacing * 2, y: verticalSpacing },
        style: {
          background: 'hsl(var(--muted))',
          border: '2px solid hsl(var(--border))',
          borderRadius: '12px',
          padding: '12px',
          fontWeight: 'bold',
          minWidth: `${nodeWidth}px`,
        },
      });
    }

    // Add static page nodes in grid layout
    staticPages.forEach((page, idx) => {
      const row = Math.floor(idx / columns);
      const col = idx % columns;
      nodes.push({
        id: page.id,
        data: { 
          label: (
            <div className="flex flex-col gap-1">
              <div className="font-medium text-sm">{page.title}</div>
              <div className="text-xs opacity-70 truncate">{page.url}</div>
            </div>
          )
        },
        position: { 
          x: col * horizontalSpacing + 50, 
          y: verticalSpacing * 2 + row * verticalSpacing 
        },
        style: {
          background: page.status === 'archived' 
            ? 'hsl(var(--muted) / 0.5)' 
            : 'hsl(var(--card))',
          border: page.status === 'archived'
            ? '1px dashed hsl(var(--muted-foreground))'
            : '2px solid hsl(var(--accent))',
          borderRadius: '8px',
          padding: '12px',
          opacity: page.status === 'archived' ? 0.6 : 1,
          width: `${nodeWidth}px`,
        },
      });
    });

    // Add generated page nodes in grid layout
    generatedPages.forEach((page, idx) => {
      const row = Math.floor(idx / columns);
      const col = idx % columns;
      nodes.push({
        id: page.id,
        data: { 
          label: (
            <div className="flex flex-col gap-1">
              <div className="font-medium text-sm truncate">{page.service}</div>
              <div className="text-xs opacity-70 truncate">{page.area}</div>
              <div className="text-xs opacity-50 truncate">{page.url}</div>
            </div>
          )
        },
        position: { 
          x: col * horizontalSpacing + horizontalSpacing * 3, 
          y: verticalSpacing * 2 + row * verticalSpacing 
        },
        style: {
          background: page.status === 'archived' 
            ? 'hsl(var(--muted) / 0.5)' 
            : 'hsl(var(--card))',
          border: page.status === 'archived'
            ? '1px dashed hsl(var(--muted-foreground))'
            : '2px solid hsl(var(--primary))',
          borderRadius: '8px',
          padding: '12px',
          opacity: page.status === 'archived' ? 0.6 : 1,
          width: `${nodeWidth}px`,
        },
      });
    });

    return nodes;
  }, [graphPages]);

  // Create edges
  const createEdges = React.useCallback((): Edge[] => {
    const edges: Edge[] = [];
    
    const staticPages = graphPages.filter(p => p.type === 'static');
    const generatedPages = graphPages.filter(p => p.type === 'generated');

    // Connect root to groups
    if (staticPages.length > 0) {
      edges.push({
        id: 'root-static',
        source: 'root',
        target: 'static-group',
        animated: true,
        style: { stroke: 'hsl(var(--muted-foreground))' },
      });
    }
    
    if (generatedPages.length > 0) {
      edges.push({
        id: 'root-generated',
        source: 'root',
        target: 'generated-group',
        animated: true,
        style: { stroke: 'hsl(var(--muted-foreground))' },
      });
    }

    // Connect static pages
    staticPages.forEach(page => {
      edges.push({
        id: `static-group-${page.id}`,
        source: 'static-group',
        target: page.id,
        animated: page.status === 'active',
        style: { 
          stroke: page.status === 'archived' 
            ? 'hsl(var(--muted-foreground) / 0.3)' 
            : 'hsl(var(--accent))' 
        },
      });
    });

    // Connect generated pages
    generatedPages.forEach(page => {
      edges.push({
        id: `generated-group-${page.id}`,
        source: 'generated-group',
        target: page.id,
        animated: page.status === 'active',
        style: { 
          stroke: page.status === 'archived' 
            ? 'hsl(var(--muted-foreground) / 0.3)' 
            : 'hsl(var(--primary))' 
        },
      });
    });

    return edges;
  }, [graphPages]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Update nodes/edges when data or filters change
  React.useEffect(() => {
    setNodes(createNodes());
    setEdges(createEdges());
  }, [createNodes, createEdges, setNodes, setEdges]);

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

      {/* Search and View Controls */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pages by title, URL, service, or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'graph' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('graph')}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Graph
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      {viewMode === 'graph' ? (
        <div className="space-y-4">
          {filteredPages.length > graphPageLimit && (
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Showing {graphPageLimit} of {filteredPages.length} pages in graph view
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use search to filter pages or increase the limit. Graph view works best with fewer pages.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGraphPageLimit(Math.min(graphPageLimit + 50, filteredPages.length))}
                  >
                    Show More
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    Switch to List View
                  </Button>
                </div>
              </div>
            </Card>
          )}
          <Card className="p-0 overflow-hidden" style={{ height: '700px' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
              attributionPosition="bottom-left"
              minZoom={0.1}
              maxZoom={1.5}
            >
              <Background />
              <Controls />
              <MiniMap 
                nodeColor={(node) => {
                  if (node.id === 'root') return 'hsl(var(--primary))';
                  if (node.id.includes('group')) return 'hsl(var(--muted))';
                  return 'hsl(var(--card))';
                }}
              />
              <Panel position="top-right" className="bg-card border rounded-lg p-3">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Pages in View</div>
                  <div className="text-2xl font-bold text-primary">
                    {graphPages.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    of {filteredPages.length} total
                  </div>
                </div>
              </Panel>
            </ReactFlow>
          </Card>
        </div>
      ) : (
        <Card className="p-6">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Pages ({filteredPages.length})</TabsTrigger>
              <TabsTrigger value="static">Static ({filteredPages.filter(p => p.type === 'static').length})</TabsTrigger>
              <TabsTrigger value="generated">Generated ({filteredPages.filter(p => p.type === 'generated').length})</TabsTrigger>
            </TabsList>

            {['all', 'static', 'generated'].map(tab => (
              <TabsContent key={tab} value={tab} className="space-y-2">
                {filteredPages
                  .filter(page => tab === 'all' || page.type === tab)
                  .map(page => (
                    <HoverCard key={page.id} openDelay={200}>
                      <HoverCardTrigger asChild>
                        <div
                          className={`
                            p-4 rounded-lg border-2 transition-all cursor-pointer
                            hover:shadow-lg hover:border-primary
                            ${page.status === 'archived' 
                              ? 'opacity-50 border-dashed border-muted-foreground' 
                              : 'border-border'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                              {page.type === 'static' ? (
                                <FileText className="h-5 w-5 text-accent" />
                              ) : (
                                <Globe className="h-5 w-5 text-primary" />
                              )}
                              <div className="flex-1">
                                <div className="font-medium">{page.title}</div>
                                <div className="text-sm text-muted-foreground font-mono">
                                  {page.url}
                                </div>
                                {page.service && page.area && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {page.service} • {page.area}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={page.status === 'active' ? 'default' : 'secondary'}
                              >
                                {page.status === 'archived' ? (
                                  <>
                                    <Archive className="h-3 w-3 mr-1" />
                                    Archived
                                  </>
                                ) : (
                                  'Active'
                                )}
                              </Badge>
                              <Badge variant="outline">
                                {page.type === 'static' ? 'Static' : 'Generated'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(page.url, '_blank');
                                }}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent side="left" className="w-96">
                        <div className="space-y-2">
                          <div className="font-semibold">{page.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {page.meta_description || 'No description available'}
                          </div>
                          <div className="text-xs text-muted-foreground pt-2 border-t">
                            <div>Type: {page.type}</div>
                            <div>Status: {page.status}</div>
                            <div>URL: {page.url}</div>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  ))}
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      )}
    </div>
  );
};

export default SitemapPage;
