import { useState, useEffect } from 'react';
import { EmailService } from '@/services/emailService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EmailPreviewProps {
  template: any;
}

const EmailPreview = ({ template }: EmailPreviewProps) => {
  const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);

  useEffect(() => {
    const loadPreview = async () => {
      const defaultVars = await EmailService.getDefaultVariables();
      const sampleData = {
        ...defaultVars,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '(555) 123-4567',
        account_name: 'Acme Corp',
        invoice_number: 'INV-001',
        amount_due: '$1,250.00',
        due_date: '2024-12-31',
        task_title: 'Complete Project Review',
        task_due_date: '2024-12-15',
        task_priority: 'High',
        project_name: 'Website Redesign',
        project_status: 'In Progress',
        user_name: 'Jane Smith'
      };

      const result = await EmailService.previewTemplate(template.id, sampleData);
      setPreview(result);
    };

    loadPreview();
  }, [template]);

  if (!preview) {
    return <div className="p-8 text-center">Loading preview...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Template Details</h3>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Name:</span>
            <span className="text-sm">{template.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Category:</span>
            <Badge variant="outline">{template.category}</Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview with Sample Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="text-sm font-semibold text-muted-foreground">Subject:</span>
            <p className="mt-1 p-3 bg-gray-50 rounded border">{preview.subject}</p>
          </div>

          <div>
            <span className="text-sm font-semibold text-muted-foreground">Body:</span>
            <div
              className="mt-1 p-4 bg-white rounded border"
              dangerouslySetInnerHTML={{ __html: preview.body }}
            />
          </div>
        </CardContent>
      </Card>

      {template.variables && template.variables.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">Available Variables</h3>
          <div className="flex flex-wrap gap-2">
            {template.variables.map((variable: string) => (
              <Badge key={variable} variant="secondary">
                {`{{${variable}}}`}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailPreview;
