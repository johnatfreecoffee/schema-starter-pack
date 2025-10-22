
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { renderTemplate, renderTemplateWithReviews } from '@/lib/templateEngine';
import { useEffect, useState } from 'react';

interface TemplatePreviewProps {
  templateHtml: string;
  onClose: () => void;
}

const sampleData = {
  service_name: "Storm Damage Restoration",
  service_slug: "storm-damage-restoration",
  service_description: "Professional storm damage assessment and repair for residential and commercial properties. Our experienced team responds quickly to minimize further damage and restore your property to its pre-storm condition.",
  service_starting_price: "$1,500",
  service_category: "Emergency Services",
  city_name: "New Orleans",
  city_slug: "new-orleans",
  display_name: "New Orleans, Louisiana",
  local_description: "Serving the Greater New Orleans area with 24/7 emergency response. Our local team understands the unique challenges of Louisiana weather and building codes.",
  company_name: "Clear Home Roofing & Restoration",
  company_phone: "(504) 555-0123",
  company_email: "info@clearhome.com",
  company_address: "123 Main St, New Orleans, LA 70001",
  company_description: "Louisiana's trusted roofing and restoration experts since 2010. We specialize in storm damage repair, roof replacement, and emergency services.",
  company_slogan: "Your Trusted Roofing Experts",
  years_experience: "14",
  logo_url: "/logo.png",
  icon_url: "/icon.png"
};

const TemplatePreview = ({ templateHtml, onClose }: TemplatePreviewProps) => {
  const [activeTab, setActiveTab] = useState('rendered');
  const [renderedHtml, setRenderedHtml] = useState('');

  useEffect(() => {
    const renderAsync = async () => {
      const html = await renderTemplateWithReviews(templateHtml, sampleData, { serviceId: undefined });
      setRenderedHtml(html);
    };
    renderAsync();
  }, [templateHtml]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b flex justify-between items-center">
        <h2 className="text-2xl font-bold">Template Preview</h2>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-6 pt-4">
          <TabsList>
            <TabsTrigger value="rendered">Rendered</TabsTrigger>
            <TabsTrigger value="source">Source HTML</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="rendered" className="flex-1 overflow-auto mt-0">
          <div className="w-full h-full min-h-[600px]">
            <iframe
              srcDoc={renderedHtml}
              className="w-full h-full min-h-[600px] border-0"
              title="Template Preview"
              sandbox="allow-same-origin"
            />
          </div>
        </TabsContent>

        <TabsContent value="source" className="flex-1 p-6 overflow-auto mt-0">
          <pre className="bg-muted p-4 rounded-lg overflow-auto">
            <code>{renderedHtml}</code>
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TemplatePreview;
