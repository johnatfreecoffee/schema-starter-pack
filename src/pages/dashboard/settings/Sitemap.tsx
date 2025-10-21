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
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [layoutMode, setLayoutMode] = useState<'hierarchical' | 'force' | 'circular'>('hierarchical');

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

  // Create nodes for React Flow
  const createNodes = (): Node[] => {
    const nodes: Node[] = [];
    
    // Root node
    nodes.push({
      id: 'root',
      type: 'input',
      data: { label: '🏠 Home' },
      position: { x: 400, y: 0 },
      style: {
        background: 'hsl(var(--primary))',
        color: 'hsl(var(--primary-foreground))',
        border: '2px solid hsl(var(--primary))',
        borderRadius: '12px',
        padding: '16px',
        fontSize: '16px',
        fontWeight: 'bold',
      },
    });

    // Static pages group
    nodes.push({
      id: 'static-group',
      type: 'default',
      data: { label: '📄 Static Pages' },
      position: { x: 100, y: 150 },
      style: {
        background: 'hsl(var(--muted))',
        border: '2px solid hsl(var(--border))',
        borderRadius: '12px',
        padding: '12px',
        fontWeight: 'bold',
      },
    });

    // Generated pages group
    nodes.push({
      id: 'generated-group',
      type: 'default',
      data: { label: '🔄 Generated Pages' },
      position: { x: 700, y: 150 },
      style: {
        background: 'hsl(var(--muted))',
        border: '2px solid hsl(var(--border))',
        borderRadius: '12px',
        padding: '12px',
        fontWeight: 'bold',
      },
    });

    // Add static page nodes
    filteredPages
      .filter(p => p.type === 'static')
      .forEach((page, idx) => {
        const yOffset = layoutMode === 'hierarchical' ? idx * 80 : Math.random() * 400;
        nodes.push({
          id: page.id,
          data: { 
            label: (
              <div className="flex flex-col gap-1">
                <div className="font-medium">{page.title}</div>
                <div className="text-xs opacity-70">{page.url}</div>
              </div>
            )
          },
          position: { x: 50, y: 250 + yOffset },
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
            minWidth: '180px',
          },
        });
      });

    // Add generated page nodes
    filteredPages
      .filter(p => p.type === 'generated')
      .forEach((page, idx) => {
        const yOffset = layoutMode === 'hierarchical' ? idx * 80 : Math.random() * 400;
        nodes.push({
          id: page.id,
          data: { 
            label: (
              <div className="flex flex-col gap-1">
                <div className="font-medium text-sm">{page.service}</div>
                <div className="text-xs opacity-70">{page.area}</div>
                <div className="text-xs opacity-50">{page.url}</div>
              </div>
            )
          },
          position: { x: 650, y: 250 + yOffset },
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
            minWidth: '200px',
          },
        });
      });

    return nodes;
  };

  // Create edges
  const createEdges = (): Edge[] => {
    const edges: Edge[] = [];

    // Connect root to groups
    edges.push(
      {
        id: 'root-static',
        source: 'root',
        target: 'static-group',
        animated: true,
        style: { stroke: 'hsl(var(--muted-foreground))' },
      },
      {
        id: 'root-generated',
        source: 'root',
        target: 'generated-group',
        animated: true,
        style: { stroke: 'hsl(var(--muted-foreground))' },
      }
    );

    // Connect static pages
    filteredPages
      .filter(p => p.type === 'static')
      .forEach(page => {
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
    filteredPages
      .filter(p => p.type === 'generated')
      .forEach(page => {
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
  };

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Update nodes/edges when data or filters change
  React.useEffect(() => {
    setNodes(createNodes());
    setEdges(createEdges());
  }, [filteredPages, layoutMode]);

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
        <Card className="p-0 overflow-hidden" style={{ height: '600px' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            attributionPosition="bottom-left"
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
                <div className="text-sm font-medium">Layout</div>
                <div className="flex gap-2">
                  <Button
                    variant={layoutMode === 'hierarchical' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setLayoutMode('hierarchical');
                      setNodes(createNodes());
                      setEdges(createEdges());
                    }}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Hierarchy
                  </Button>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </Card>
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
