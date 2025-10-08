import CustomerLayout from '@/components/layout/CustomerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const CustomerInvoices = () => {
  return (
    <CustomerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Invoices & Payments</h1>
          <p className="text-muted-foreground mt-1">View and pay your invoices</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Coming soon - View and pay your invoices here
            </p>
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  );
};

export default CustomerInvoices;
