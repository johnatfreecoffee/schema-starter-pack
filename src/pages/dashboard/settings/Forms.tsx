import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadFormEmbed } from "@/components/lead-form/LeadFormEmbed";
import { useState } from "react";

const Forms = () => {
  const [selectedForm, setSelectedForm] = useState("universal-lead-form");

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Forms Management</h1>
        <p className="text-muted-foreground">
          Manage your forms and configure how leads are captured across your website.
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div>
          <label className="text-sm font-medium mb-2 block">Select Form</label>
          <Select value={selectedForm} onValueChange={setSelectedForm}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Choose a form" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="universal-lead-form">Universal Lead Form</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedForm === "universal-lead-form" && (
          <div className="space-y-4 border-t pt-6">
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
        )}
      </Card>
    </div>
  );
};

export default Forms;
