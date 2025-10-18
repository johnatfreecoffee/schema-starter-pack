import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Phone, Mail, MapPin } from 'lucide-react';
import { LeadFormEmbed } from '@/components/lead-form/LeadFormEmbed';

const Contact = () => {
  const { data: company } = useCompanySettings();

  return (
    <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Contact Us</h1>
        <div className="max-w-2xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Get In Touch</CardTitle>
              <CardDescription>We'd love to hear from you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {company?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-muted-foreground">{company.phone}</p>
                  </div>
                </div>
              )}
              {company?.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted-foreground">{company.email}</p>
                  </div>
                </div>
              )}
              {company?.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-muted-foreground">{company.address}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <LeadFormEmbed 
            headerText="Send Us a Message"
            showHeader={true}
          />
        </div>
      </div>
  );
};

export default Contact;
