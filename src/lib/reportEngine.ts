import { supabase } from "@/integrations/supabase/client";

export interface ReportConfig {
  dataSource: string;
  selectedFields: string[];
  filters?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  grouping?: {
    field: string;
    aggregationType: string;
  };
}

export async function executeReport(config: ReportConfig, companyId?: string) {
  const { dataSource, selectedFields, filters, grouping } = config;
  
  // Build query based on data source - use type assertion for dynamic table name
  let query = (supabase.from as any)(dataSource).select(selectedFields.join(','));
  
  // Apply company filter if available
  if (companyId) {
    query = query.eq('company_id', companyId);
  }
  
  // Apply filters
  if (filters && filters.length > 0) {
    filters.forEach((filter: any) => {
      switch (filter.operator) {
        case 'equals':
          query = query.eq(filter.field, filter.value);
          break;
        case 'not_equals':
          query = query.neq(filter.field, filter.value);
          break;
        case 'contains':
          query = query.ilike(filter.field, `%${filter.value}%`);
          break;
        case 'greater_than':
          query = query.gt(filter.field, filter.value);
          break;
        case 'less_than':
          query = query.lt(filter.field, filter.value);
          break;
        case 'greater_than_or_equal':
          query = query.gte(filter.field, filter.value);
          break;
        case 'less_than_or_equal':
          query = query.lte(filter.field, filter.value);
          break;
      }
    });
  }
  
  // Execute query
  const { data, error } = await query;
  
  if (error) throw error;
  
  // Apply grouping/aggregation if specified
  if (grouping && grouping.field) {
    return applyAggregation(data || [], grouping);
  }
  
  return data || [];
}

function applyAggregation(data: any[], grouping: any) {
  const { field, aggregationType } = grouping;
  
  // Group data by field
  const grouped = data.reduce((acc, item) => {
    const key = item[field] || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, any[]>);
  
  // Apply aggregation
  return Object.entries(grouped).map(([key, items]: [string, any]) => {
    let value;
    
    switch (aggregationType) {
      case 'count':
        value = items.length;
        break;
      case 'sum':
        value = items.reduce((sum, item) => sum + (parseFloat(item.amount || item.total || item.total_amount) || 0), 0);
        break;
      case 'avg':
        const sum = items.reduce((s, item) => s + (parseFloat(item.amount || item.total || item.total_amount) || 0), 0);
        value = sum / items.length;
        break;
      case 'min':
        value = Math.min(...items.map(item => parseFloat(item.amount || item.total || item.total_amount) || 0));
        break;
      case 'max':
        value = Math.max(...items.map(item => parseFloat(item.amount || item.total || item.total_amount) || 0));
        break;
      default:
        value = items.length;
    }
    
    return { [field]: key, value };
  });
}
