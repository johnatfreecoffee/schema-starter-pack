import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadFormEmbed } from "@/components/lead-form/LeadFormEmbed";

const Forms = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Forms Management</h1>
        <p className="text-muted-foreground">
          Manage your forms and configure how leads are captured across your website.
        </p>
      </div>

      <Tabs defaultValue="universal" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="universal">Universal Form</TabsTrigger>
          <TabsTrigger value="custom">Custom Forms</TabsTrigger>
        </TabsList>

        <TabsContent value="universal" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Universal Lead Form</h2>
                <p className="text-muted-foreground mb-4">
                  This is your main lead capture form that can be used across all pages. 
                  It can be triggered by buttons, embedded in pages, or opened as a modal.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                  <p className="font-semibold">How to use this form:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Add a button anywhere on your site that triggers the form modal</li>
                    <li>The button's label becomes the form's header text</li>
                    <li>Example: "Get a Quote", "Contact Us", "Schedule Service"</li>
                    <li>All submissions go to the Leads section in your dashboard</li>
                  </ul>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Preview</h3>
                <LeadFormEmbed 
                  headerText="Request a Free Quote"
                  showHeader={true}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <Card className="p-6">
            <div className="text-center py-12 space-y-4">
              <div className="text-6xl mb-4">🚧</div>
              <h2 className="text-2xl font-semibold">Custom Forms Coming Soon</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Build specialized forms with custom fields, validation rules, and workflows. 
                This feature will allow you to create forms for specific services, applications, 
                registrations, and more.
              </p>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 max-w-md mx-auto mt-6">
                <p className="text-sm font-medium">
                  For now, use the Universal Lead Form for all lead capture needs. 
                  You can customize the form fields in Settings → Form Fields.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Forms;
