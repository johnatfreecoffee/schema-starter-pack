import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, MapPin, UserPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface TopService {
  service_name: string;
  total_revenue: number;
  invoice_count: number;
  percentage: number;
}

interface TopServiceArea {
  city_name: string;
  page_count: number;
  view_count: number;
  trend: number;
}

interface TopLeadSource {
  source: string;
  lead_count: number;
  conversion_rate: number;
  percentage: number;
}

export function TopPerformersWidget() {
  const [topServices, setTopServices] = useState<TopService[]>([]);
  const [topAreas, setTopAreas] = useState<TopServiceArea[]>([]);
  const [topSources, setTopSources] = useState<TopLeadSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopPerformers();
  }, []);

  const loadTopPerformers = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTopServices(),
        loadTopServiceAreas(),
        loadTopLeadSources(),
      ]);
    } catch (error) {
      console.error('Error loading top performers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTopServices = async () => {
    const { data: invoiceItems } = await supabase
      .from('invoice_items')
      .select('amount, description');

    if (!invoiceItems) return;

    // Group by description (service) and sum amounts
    const serviceMap = new Map<string, { revenue: number; count: number }>();
    invoiceItems.forEach((item) => {
      const existing = serviceMap.get(item.description) || { revenue: 0, count: 0 };
      serviceMap.set(item.description, {
        revenue: existing.revenue + item.amount,
        count: existing.count + 1,
      });
    });

    const totalRevenue = Array.from(serviceMap.values()).reduce((sum, s) => sum + s.revenue, 0);
    
    const services = Array.from(serviceMap.entries())
      .map(([name, data]) => ({
        service_name: name,
        total_revenue: data.revenue / 100, // Convert from cents
        invoice_count: data.count,
        percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 5);

    setTopServices(services);
  };

  const loadTopServiceAreas = async () => {
    const { data: pages } = await supabase
      .from('generated_pages')
      .select('service_area_id, view_count, service_areas(city_name)')
      .eq('status', true);

    if (!pages) return;

    const areaMap = new Map<string, { count: number; views: number }>();
    pages.forEach((page: any) => {
      const cityName = page.service_areas?.city_name || 'Unknown';
      const existing = areaMap.get(cityName) || { count: 0, views: 0 };
      areaMap.set(cityName, {
        count: existing.count + 1,
        views: existing.views + (page.view_count || 0),
      });
    });

    const areas = Array.from(areaMap.entries())
      .map(([name, data]) => ({
        city_name: name,
        page_count: data.count,
        view_count: data.views,
        trend: Math.floor(Math.random() * 20) - 5, // Placeholder trend
      }))
      .sort((a, b) => b.view_count - a.view_count)
      .slice(0, 5);

    setTopAreas(areas);
  };

  const loadTopLeadSources = async () => {
    const { data: leads } = await supabase
      .from('leads')
      .select('source, status');

    if (!leads) return;

    const sourceMap = new Map<string, { total: number; converted: number }>();
    leads.forEach((lead) => {
      const source = lead.source || 'Unknown';
      const existing = sourceMap.get(source) || { total: 0, converted: 0 };
      sourceMap.set(source, {
        total: existing.total + 1,
        converted: existing.converted + (lead.status === 'converted' ? 1 : 0),
      });
    });

    const totalLeads = leads.length;
    
    const sources = Array.from(sourceMap.entries())
      .map(([name, data]) => ({
        source: name,
        lead_count: data.total,
        conversion_rate: data.total > 0 ? (data.converted / data.total) * 100 : 0,
        percentage: totalLeads > 0 ? (data.total / totalLeads) * 100 : 0,
      }))
      .sort((a, b) => b.lead_count - a.lead_count)
      .slice(0, 5);

    setTopSources(sources);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((j) => (
                  <Skeleton key={j} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Top Services by Revenue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-green-100 text-green-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            Top Services by Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topServices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No revenue data available yet
            </p>
          ) : (
            <div className="space-y-4">
              {topServices.map((service, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">{service.service_name}</span>
                    <span className="font-bold text-sm">${service.total_revenue.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{service.invoice_count} invoices</span>
                    <span>{service.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-green-500 h-full rounded-full transition-all"
                      style={{ width: `${service.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Most Active Service Areas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600">
              <MapPin className="h-4 w-4" />
            </div>
            Most Active Service Areas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topAreas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No service area data available yet
            </p>
          ) : (
            <div className="space-y-4">
              {topAreas.map((area, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{area.city_name}</span>
                    <span className={`text-xs flex items-center gap-1 ${area.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {area.trend > 0 ? '↑' : '↓'} {Math.abs(area.trend)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{area.page_count} pages</span>
                    <span>{area.view_count} views</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min((area.view_count / 100) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Lead Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-purple-100 text-purple-600">
              <UserPlus className="h-4 w-4" />
            </div>
            Top Lead Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topSources.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No lead source data available yet
            </p>
          ) : (
            <div className="space-y-4">
              {topSources.map((source, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm capitalize">{source.source.replace('_', ' ')}</span>
                    <span className="font-bold text-sm">{source.lead_count} leads</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{source.conversion_rate.toFixed(1)}% conversion</span>
                    <span>{source.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all"
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
