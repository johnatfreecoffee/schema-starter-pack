import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AITrainingData {
  id?: string;
  brand_voice: string;
  mission_statement: string;
  customer_promise: string;
  competitive_positioning: string;
  unique_selling_points: string;
  competitive_advantages: string;
  target_audience: string;
  service_standards: string;
  certifications: string;
  emergency_response: string;
  service_area_coverage: string;
  project_timeline: string;
  payment_options: string;
  updated_at?: string;
  updated_by?: string;
}

const AITraining = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<AITrainingData>({
    brand_voice: '',
    mission_statement: '',
    customer_promise: '',
    competitive_positioning: '',
    unique_selling_points: '',
    competitive_advantages: '',
    target_audience: '',
    service_standards: '',
    certifications: '',
    emergency_response: '',
    service_area_coverage: '',
    project_timeline: '',
    payment_options: '',
  });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    brandVoice: true,
    uniqueValue: false,
    serviceDetails: false,
    businessOps: false,
  });

  // Fetch AI training data
  const { data: aiTrainingData, isLoading } = useQuery({
    queryKey: ['ai-training'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_training')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      // If no record exists, create one
      if (!data) {
        const { data: session } = await supabase.auth.getSession();
        const { data: newData, error: insertError } = await supabase
          .from('ai_training')
          .insert({
            brand_voice: '',
            updated_by: session.session?.user.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newData;
      }

      return data;
    },
  });

  // Update form data when query data changes
  useEffect(() => {
    if (aiTrainingData) {
      setFormData(aiTrainingData);
    }
  }, [aiTrainingData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: AITrainingData) => {
      const { data: session } = await supabase.auth.getSession();
      
      // If we have an ID, update. Otherwise, insert.
      if (aiTrainingData?.id) {
        const { data: result, error } = await supabase
          .from('ai_training')
          .update({
            ...data,
            updated_by: session.session?.user.id,
          })
          .eq('id', aiTrainingData.id)
          .select()
          .single();

        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('ai_training')
          .insert({
            ...data,
            updated_by: session.session?.user.id,
          })
          .select()
          .single();

        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-training'] });
      toast({
        title: 'Success',
        description: 'AI training data saved successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to save AI training data',
        variant: 'destructive',
      });
      console.error('Save error:', error);
    },
  });

  const handleFieldChange = (field: keyof AITrainingData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const countLines = (text: string) => {
    return text.split('\n').filter((line) => line.trim()).length;
  };

  const FormField = ({
    label,
    field,
    rows,
    placeholder,
    helperText,
    showLineCount,
  }: {
    label: string;
    field: keyof AITrainingData;
    rows: number;
    placeholder: string;
    helperText: string;
    showLineCount?: boolean;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={field}>{label}</Label>
      <Textarea
        id={field}
        value={formData[field] || ''}
        onChange={(e) => handleFieldChange(field, e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="resize-y"
      />
      <div className="flex justify-between items-start">
        <p className="text-sm text-muted-foreground">{helperText}</p>
        {showLineCount && (
          <p className="text-xs text-muted-foreground">
            {countLines(formData[field] || '')} lines
          </p>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">AI Training</h1>
          {aiTrainingData?.updated_at && (
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date(aiTrainingData.updated_at).toLocaleString()}
            </p>
          )}
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            {/* Section 1: Brand Voice & Messaging */}
            <Collapsible
              open={expandedSections.brandVoice}
              onOpenChange={() => toggleSection('brandVoice')}
            >
              <CollapsibleTrigger className="w-full bg-muted hover:bg-muted/80 px-4 py-3 rounded-md flex items-center justify-between font-semibold">
                Brand Voice & Messaging
                <ChevronDown
                  className={cn(
                    'h-5 w-5 transition-transform duration-200',
                    expandedSections.brandVoice && 'rotate-180'
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pt-4 space-y-4">
                <FormField
                  label="Brand Voice & Tone"
                  field="brand_voice"
                  rows={4}
                  placeholder="e.g., Professional yet approachable, authoritative but friendly..."
                  helperText="How should the AI communicate when writing content?"
                />
                <FormField
                  label="Mission Statement"
                  field="mission_statement"
                  rows={4}
                  placeholder="Our mission is to..."
                  helperText="Your company's core purpose and values"
                />
                <FormField
                  label="Customer Promise"
                  field="customer_promise"
                  rows={3}
                  placeholder="We promise to deliver..."
                  helperText="What customers can always expect from you"
                />
                <FormField
                  label="Competitive Positioning"
                  field="competitive_positioning"
                  rows={4}
                  placeholder="We differentiate ourselves by..."
                  helperText="How you position yourself against competitors"
                />
              </CollapsibleContent>
            </Collapsible>

            {/* Section 2: Unique Value */}
            <Collapsible
              open={expandedSections.uniqueValue}
              onOpenChange={() => toggleSection('uniqueValue')}
            >
              <CollapsibleTrigger className="w-full bg-muted hover:bg-muted/80 px-4 py-3 rounded-md flex items-center justify-between font-semibold">
                Unique Value
                <ChevronDown
                  className={cn(
                    'h-5 w-5 transition-transform duration-200',
                    expandedSections.uniqueValue && 'rotate-180'
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pt-4 space-y-4">
                <FormField
                  label="Unique Selling Points"
                  field="unique_selling_points"
                  rows={6}
                  placeholder="24/7 emergency service&#10;Lifetime warranty on workmanship&#10;Family-owned and operated"
                  helperText="Enter one selling point per line"
                  showLineCount
                />
                <FormField
                  label="Competitive Advantages"
                  field="competitive_advantages"
                  rows={6}
                  placeholder="Fastest response time in the region&#10;Exclusive storm damage expertise"
                  helperText="Why choose you over competitors? One per line"
                  showLineCount
                />
                <FormField
                  label="Target Audience"
                  field="target_audience"
                  rows={4}
                  placeholder="Homeowners in the Gulf Coast region concerned about storm damage..."
                  helperText="Who are your ideal customers?"
                />
              </CollapsibleContent>
            </Collapsible>

            {/* Section 3: Service Details */}
            <Collapsible
              open={expandedSections.serviceDetails}
              onOpenChange={() => toggleSection('serviceDetails')}
            >
              <CollapsibleTrigger className="w-full bg-muted hover:bg-muted/80 px-4 py-3 rounded-md flex items-center justify-between font-semibold">
                Service Details
                <ChevronDown
                  className={cn(
                    'h-5 w-5 transition-transform duration-200',
                    expandedSections.serviceDetails && 'rotate-180'
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pt-4 space-y-4">
                <FormField
                  label="Service Standards & Guarantees"
                  field="service_standards"
                  rows={5}
                  placeholder="All work guaranteed for 5 years&#10;Free inspections"
                  helperText="Your quality commitments and guarantees"
                />
                <FormField
                  label="Certifications & Credentials"
                  field="certifications"
                  rows={6}
                  placeholder="GAF Master Elite Certified&#10;BBB A+ Rating&#10;Fully licensed and insured"
                  helperText="Enter one credential per line"
                  showLineCount
                />
                <FormField
                  label="Emergency Response Details"
                  field="emergency_response"
                  rows={4}
                  placeholder="24/7 emergency hotline&#10;Average response time: under 2 hours"
                  helperText="How do you handle emergencies?"
                />
                <FormField
                  label="Service Area Coverage"
                  field="service_area_coverage"
                  rows={4}
                  placeholder="Serving Greater New Orleans and surrounding parishes within 50 miles..."
                  helperText="Geographic areas you serve"
                />
              </CollapsibleContent>
            </Collapsible>

            {/* Section 4: Business Operations */}
            <Collapsible
              open={expandedSections.businessOps}
              onOpenChange={() => toggleSection('businessOps')}
            >
              <CollapsibleTrigger className="w-full bg-muted hover:bg-muted/80 px-4 py-3 rounded-md flex items-center justify-between font-semibold">
                Business Operations
                <ChevronDown
                  className={cn(
                    'h-5 w-5 transition-transform duration-200',
                    expandedSections.businessOps && 'rotate-180'
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pt-4 space-y-4">
                <FormField
                  label="Typical Project Timeline"
                  field="project_timeline"
                  rows={4}
                  placeholder="Residential roof replacement: 2-3 days&#10;Commercial projects: 1-2 weeks"
                  helperText="General timeframes for common projects"
                />
                <FormField
                  label="Payment Options"
                  field="payment_options"
                  rows={4}
                  placeholder="We accept cash, check, credit cards&#10;Financing available&#10;Insurance claims assistance"
                  helperText="How customers can pay"
                />
              </CollapsibleContent>
            </Collapsible>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="gap-2"
              >
                {saveMutation.isPending ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save AI Training Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
  );
};

export default AITraining;
