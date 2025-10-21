import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, X, Sparkles, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LocalContentEditorProps {
  serviceId: string;
  areaId: string;
  service: any;
  area: any;
  onClose: () => void;
}

const LocalContentEditor = ({ serviceId, areaId, service, area, onClose }: LocalContentEditorProps) => {
  const [localContent, setLocalContent] = useState({
    local_description: '',
    local_benefits: [] as string[],
    response_time: '',
    completion_time: '',
    customer_count: 0,
    pricing_notes: '',
    local_examples: '',
    special_considerations: '',
    meta_title_override: '',
    meta_description_override: '',
  });
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const queryClient = useQueryClient();

  // Load existing content
  const { data: existingContent, isLoading } = useQuery({
    queryKey: ['service-area-content', serviceId, areaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_area_services')
        .select('*')
        .eq('service_id', serviceId)
        .eq('service_area_id', areaId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Load company settings for AI context
  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Load AI training data
  const { data: aiTraining } = useQuery({
    queryKey: ['ai-training'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_training')
        .select('*')
        .single();
      if (error) return null;
      return data;
    },
  });

  useEffect(() => {
    if (existingContent) {
      setLocalContent({
        local_description: existingContent.local_description || '',
        local_benefits: existingContent.local_benefits || [],
        response_time: existingContent.response_time || '',
        completion_time: existingContent.completion_time || '',
        customer_count: existingContent.customer_count || 0,
        pricing_notes: existingContent.pricing_notes || '',
        local_examples: existingContent.local_examples || '',
        special_considerations: existingContent.special_considerations || '',
        meta_title_override: existingContent.meta_title_override || '',
        meta_description_override: existingContent.meta_description_override || '',
      });
    }
  }, [existingContent]);

  const addBenefit = () => {
    setLocalContent({
      ...localContent,
      local_benefits: [...localContent.local_benefits, ''],
    });
  };

  const updateBenefit = (index: number, value: string) => {
    const newBenefits = [...localContent.local_benefits];
    newBenefits[index] = value;
    setLocalContent({
      ...localContent,
      local_benefits: newBenefits,
    });
  };

  const removeBenefit = (index: number) => {
    setLocalContent({
      ...localContent,
      local_benefits: localContent.local_benefits.filter((_, i) => i !== index),
    });
  };

  const generateWithAi = async () => {
    if (!aiPrompt.trim()) return;

    setIsAiLoading(true);

    try {
      const prompt = `Generate localized content for ${service.name} in ${area.city_name}.

Company Context:
- Business: ${companySettings?.business_name}
- Brand Voice: ${aiTraining?.brand_voice || 'Professional and trustworthy'}
- Target Audience: ${aiTraining?.target_audience || 'Homeowners and businesses'}
- USPs: ${aiTraining?.unique_selling_points || 'Quality service'}

Service: ${service.name}
${service.description ? `Description: ${service.description}` : ''}

Location: ${area.city_name}, ${area.state}

User Request: ${aiPrompt}

Generate the following in JSON format:
{
  "local_description": "2-3 sentences about serving this specific area",
  "local_benefits": ["benefit 1", "benefit 2", "benefit 3"],
  "response_time": "e.g., 30 minutes average",
  "completion_time": "e.g., Same day service",
  "pricing_notes": "Location-specific pricing information"
}

Return ONLY valid JSON, no markdown or explanations.`;

      const { data, error } = await supabase.functions.invoke('ai-edit-page', {
        body: {
          command: prompt,
          context: {
            currentPage: { type: 'service', html: '' },
            companyInfo: companySettings,
            aiTraining: aiTraining,
          },
        },
      });

      if (error) throw error;

      // Try to parse AI response as JSON
      try {
        const generated = JSON.parse(data.updatedHtml || '{}');
        setLocalContent({
          ...localContent,
          ...generated,
          local_benefits: Array.isArray(generated.local_benefits) 
            ? generated.local_benefits 
            : localContent.local_benefits,
        });
        toast({
          title: 'AI content generated',
          description: 'Review and adjust the generated content before saving.',
        });
      } catch (parseError) {
        toast({
          title: 'Generated content',
          description: 'AI response received. Please review the content tab.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'AI Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsAiLoading(false);
      setAiPrompt('');
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('service_area_services')
        .update({
          ...localContent,
          local_benefits: localContent.local_benefits.filter(b => b.trim()),
        })
        .eq('service_id', serviceId)
        .eq('service_area_id', areaId);

      if (error) throw error;

      // Mark page for regeneration
      await supabase
        .from('generated_pages')
        .update({ needs_regeneration: true })
        .eq('service_id', serviceId)
        .eq('service_area_id', areaId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-area-content'] });
      queryClient.invalidateQueries({ queryKey: ['generated-pages-management'] });
      toast({
        title: 'Content saved',
        description: 'Local content has been updated. Page will be regenerated.',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error saving content',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading content...</div>;
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          Edit Local Content: {service?.name} in {area?.city_name}
        </DialogTitle>
      </DialogHeader>

      <Tabs defaultValue="content" className="mt-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Local Content</TabsTrigger>
          <TabsTrigger value="seo">SEO Settings</TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Assistant
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4 mt-4">
          <ScrollArea className="h-[50vh]">
            <div className="space-y-4 pr-4">
              <div>
                <Label>Local Description</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Describe how you specifically serve {area?.city_name}
                </p>
                <Textarea
                  value={localContent.local_description}
                  onChange={(e) => setLocalContent({
                    ...localContent,
                    local_description: e.target.value
                  })}
                  rows={4}
                  placeholder={`We've been providing ${service?.name} services in ${area?.city_name} for over 10 years...`}
                />
                <p className="text-xs text-right mt-1 text-muted-foreground">
                  {localContent.local_description?.length || 0} / 1000 characters
                </p>
              </div>

              <div>
                <Label>Local Benefits</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Specific benefits for {area?.city_name} customers
                </p>
                {localContent.local_benefits?.map((benefit, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <Input
                      value={benefit}
                      onChange={(e) => updateBenefit(idx, e.target.value)}
                      placeholder="e.g., 2-hour response time in downtown"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeBenefit(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addBenefit}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Benefit
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Response Time</Label>
                  <Input
                    value={localContent.response_time}
                    onChange={(e) => setLocalContent({
                      ...localContent,
                      response_time: e.target.value
                    })}
                    placeholder="30 minutes average"
                  />
                </div>

                <div>
                  <Label>Completion Time</Label>
                  <Input
                    value={localContent.completion_time}
                    onChange={(e) => setLocalContent({
                      ...localContent,
                      completion_time: e.target.value
                    })}
                    placeholder="Same day service"
                  />
                </div>

                <div>
                  <Label>Customers Served</Label>
                  <Input
                    type="number"
                    value={localContent.customer_count}
                    onChange={(e) => setLocalContent({
                      ...localContent,
                      customer_count: parseInt(e.target.value) || 0
                    })}
                    placeholder="247"
                  />
                </div>
              </div>

              <div>
                <Label>Pricing Notes</Label>
                <Textarea
                  value={localContent.pricing_notes}
                  onChange={(e) => setLocalContent({
                    ...localContent,
                    pricing_notes: e.target.value
                  })}
                  rows={2}
                  placeholder={`${area?.city_name} pricing starts at $X. Senior discounts available.`}
                />
              </div>

              <div>
                <Label>Local Examples</Label>
                <Textarea
                  value={localContent.local_examples}
                  onChange={(e) => setLocalContent({
                    ...localContent,
                    local_examples: e.target.value
                  })}
                  rows={2}
                  placeholder="Recently completed 12 projects on Main Street"
                />
              </div>

              <div>
                <Label>Special Considerations</Label>
                <Textarea
                  value={localContent.special_considerations}
                  onChange={(e) => setLocalContent({
                    ...localContent,
                    special_considerations: e.target.value
                  })}
                  rows={2}
                  placeholder="Any special considerations for this area"
                />
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4 mt-4">
          <div>
            <Label>Meta Title Override</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Leave blank to use default: "{service?.name} in {area?.city_name} | {companySettings?.business_name}"
            </p>
            <Input
              value={localContent.meta_title_override}
              onChange={(e) => setLocalContent({
                ...localContent,
                meta_title_override: e.target.value
              })}
              placeholder={`${service?.name} in ${area?.city_name} | ${companySettings?.business_name}`}
              maxLength={60}
            />
            <p className="text-xs text-right mt-1 text-muted-foreground">
              {localContent.meta_title_override?.length || 0} / 60
            </p>
          </div>

          <div>
            <Label>Meta Description Override</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Leave blank to use default description
            </p>
            <Textarea
              value={localContent.meta_description_override}
              onChange={(e) => setLocalContent({
                ...localContent,
                meta_description_override: e.target.value
              })}
              rows={3}
              placeholder={`Professional ${service?.name} in ${area?.city_name}. Fast response, quality work.`}
              maxLength={160}
            />
            <p className="text-xs text-right mt-1 text-muted-foreground">
              {localContent.meta_description_override?.length || 0} / 160
            </p>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="mt-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">AI Content Generator</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ask AI to generate localized content for {service?.name} in {area?.city_name}
                </p>

                <div className="space-y-2">
                  <Label>What would you like to generate?</Label>
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Example: Generate a local description highlighting our fast response time and experience in this area"
                    rows={3}
                  />
                  <Button
                    onClick={generateWithAi}
                    disabled={isAiLoading || !aiPrompt.trim()}
                    className="w-full"
                  >
                    {isAiLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Content
                      </>
                    )}
                  </Button>
                </div>

                <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                  <p className="font-semibold mb-2">Suggested prompts:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Generate a local description and benefits</li>
                    <li>• Create pricing notes for this area</li>
                    <li>• Write about our response time and service quality</li>
                    <li>• Generate customer testimonial-style content</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <DialogFooter className="mt-6">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving...' : 'Save Local Content'}
        </Button>
      </DialogFooter>
    </>
  );
};

export default LocalContentEditor;
