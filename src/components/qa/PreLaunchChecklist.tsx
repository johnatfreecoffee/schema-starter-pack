import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  autoCheck?: () => Promise<boolean>;
}

export const PreLaunchChecklist = () => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [autoChecks, setAutoChecks] = useState<Record<string, boolean>>({});

  const checklistItems: ChecklistItem[] = [
    // Setup & Configuration
    { id: 'company_info', label: 'Company information completed', category: 'Setup', 
      autoCheck: async () => {
        const { data } = await supabase.from('company_settings').select('business_name').single();
        return !!data?.business_name;
      }
    },
    { id: 'services', label: 'At least 1 service created', category: 'Setup',
      autoCheck: async () => {
        const { count } = await supabase.from('services').select('*', { count: 'exact', head: true });
        return (count || 0) > 0;
      }
    },
    { id: 'service_areas', label: 'At least 1 service area created', category: 'Setup',
      autoCheck: async () => {
        const { count } = await supabase.from('service_areas').select('*', { count: 'exact', head: true });
        return (count || 0) > 0;
      }
    },
    { id: 'logo', label: 'Logo uploaded', category: 'Setup',
      autoCheck: async () => {
        const { data } = await supabase.from('company_settings').select('logo_url').single();
        return !!data?.logo_url;
      }
    },
    
    // Content
    { id: 'static_pages', label: 'Static pages have content', category: 'Content',
      autoCheck: async () => {
        const { count } = await supabase.from('static_pages').select('*', { count: 'exact', head: true });
        return (count || 0) > 0;
      }
    },
    { id: 'templates', label: 'Service templates configured', category: 'Content',
      autoCheck: async () => {
        const { count } = await supabase.from('templates').select('*', { count: 'exact', head: true });
        return (count || 0) > 0;
      }
    },
    { id: 'generated_pages', label: 'Generated pages exist', category: 'Content',
      autoCheck: async () => {
        const { count } = await supabase.from('generated_pages').select('*', { count: 'exact', head: true });
        return (count || 0) > 0;
      }
    },
    { id: 'seo_meta', label: 'SEO meta tags configured', category: 'Content' },
    
    // Functionality
    { id: 'lead_form', label: 'Lead form tested', category: 'Functionality' },
    { id: 'email_notifications', label: 'Email notifications verified', category: 'Functionality',
      autoCheck: async () => {
        const { count } = await supabase.from('email_templates').select('*', { count: 'exact', head: true });
        return (count || 0) > 0;
      }
    },
    { id: 'customer_portal', label: 'Customer portal functional', category: 'Functionality' },
    { id: 'crm_modules', label: 'CRM modules tested', category: 'Functionality' },
    { id: 'quotes_invoices', label: 'Quotes and invoices working', category: 'Functionality' },
    
    // Security & Access
    { id: 'admin_user', label: 'Admin user created', category: 'Security',
      autoCheck: async () => {
        const { count } = await supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'admin');
        return (count || 0) > 0;
      }
    },
    { id: 'passwords', label: 'Strong passwords enforced', category: 'Security' },
    { id: 'portal_access', label: 'Customer portal restricted properly', category: 'Security' },
    { id: 'role_permissions', label: 'Role permissions verified', category: 'Security' },
    
    // Performance
    { id: 'page_speed', label: 'Pages load quickly', category: 'Performance' },
    { id: 'no_broken_links', label: 'No broken links found', category: 'Performance' },
    { id: 'mobile_responsive', label: 'Mobile responsive verified', category: 'Performance' },
    { id: 'images_optimized', label: 'Images optimized', category: 'Performance' },
  ];

  useEffect(() => {
    const runAutoChecks = async () => {
      const results: Record<string, boolean> = {};
      for (const item of checklistItems) {
        if (item.autoCheck) {
          try {
            results[item.id] = await item.autoCheck();
          } catch {
            results[item.id] = false;
          }
        }
      }
      setAutoChecks(results);
    };
    runAutoChecks();
  }, []);

  const toggleItem = (id: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedItems(newChecked);
  };

  const categories = [...new Set(checklistItems.map(item => item.category))];
  const totalItems = checklistItems.length;
  const checkedCount = checklistItems.filter(item => 
    checkedItems.has(item.id) || autoChecks[item.id]
  ).length;
  const progress = (checkedCount / totalItems) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pre-Launch Checklist</CardTitle>
        <CardDescription>
          Verify all requirements before going live
        </CardDescription>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {checkedCount} of {totalItems} complete
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {categories.map(category => (
            <div key={category}>
              <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">
                {category}
              </h3>
              <div className="space-y-2">
                {checklistItems
                  .filter(item => item.category === category)
                  .map(item => {
                    const isAutoChecked = autoChecks[item.id];
                    const isManuallyChecked = checkedItems.has(item.id);
                    const isChecked = isAutoChecked || isManuallyChecked;
                    
                    return (
                      <div key={item.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                        <Checkbox
                          id={item.id}
                          checked={isChecked}
                          onCheckedChange={() => toggleItem(item.id)}
                          disabled={isAutoChecked}
                        />
                        <label
                          htmlFor={item.id}
                          className="flex-1 text-sm cursor-pointer select-none"
                        >
                          {item.label}
                          {isAutoChecked && (
                            <span className="ml-2 text-xs text-green-600">(auto-verified)</span>
                          )}
                        </label>
                        {isChecked && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};