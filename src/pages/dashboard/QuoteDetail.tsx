import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import NotesSection from "@/components/admin/notes/NotesSection";
import DocumentActions from "@/components/admin/money/DocumentActions";
import ActivityFeed from "@/components/admin/ActivityFeed";
import QuoteStatusBadge from "@/components/admin/money/QuoteStatusBadge";
import { format } from "date-fns";
import { EntityActivityTab } from "@/components/admin/EntityActivityTab";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<any>(null);
  const [lineItems, setLineItems] = useState<any[]>([]);

  useEffect(() => {
    fetchQuoteDetails();
  }, [id]);

  const fetchQuoteDetails = async () => {
    try {
      setLoading(true);

      const { data: quoteData, error: quoteError } = await supabase
        .from("quotes")
        .select(`
          *,
          accounts (
            account_name,
            contacts (
              first_name,
              last_name,
              email,
              phone
            )
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (quoteError) throw quoteError;
      if (!quoteData) {
        toast({
          title: "Not Found",
          description: "Quote not found",
          variant: "destructive",
        });
        navigate("/dashboard/money");
        return;
      }

      setQuote(quoteData);

      // Fetch line items
      const { data: itemsData, error: itemsError } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", id)
        .order("item_order", { ascending: true });

      if (itemsError) throw itemsError;
      setLineItems(itemsData || []);
    } catch (error: any) {
      console.error("Error fetching quote:", error);
      toast({
        title: "Error",
        description: "Failed to load quote details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  if (loading) {
    return (
      <div className="p-8">Loading quote details...</div>
    );
  }

  if (!quote) return null;

  const subtotal = calculateSubtotal();
  const total = quote.total_amount || 0;

  return (
    <>
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard/money")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Money
          </Button>
        </div>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Quote #{quote.quote_number}</h1>
            <QuoteStatusBadge status={quote.status} />
          </div>
          
          <DocumentActions
            documentType="quote"
            documentId={id!}
            documentNumber={quote.quote_number}
            lineItems={lineItems.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              amount: item.amount,
            }))}
            customerEmail={quote.accounts?.contacts?.[0]?.email}
          />
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quote Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Quote Number</p>
                      <p className="text-sm">{quote.quote_number}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <QuoteStatusBadge status={quote.status} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Customer</p>
                      <p className="text-sm">{quote.accounts?.account_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Created Date</p>
                      <p className="text-sm">
                        {format(new Date(quote.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    {quote.valid_until && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Valid Until</p>
                        <p className="text-sm">
                          {format(new Date(quote.valid_until), "MMM d, yyyy")}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Line Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {lineItems.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No line items</p>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lineItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.description}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">
                                ${(item.unit_price / 100).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                ${(item.amount / 100).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      <div className="mt-6 space-y-2 border-t pt-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span>${(subtotal / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span>${(total / 100).toFixed(2)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {quote.accounts?.contacts && quote.accounts.contacts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {quote.accounts.contacts.map((contact: any, index: number) => (
                      <div key={index}>
                        <p className="text-sm font-medium">
                          {contact.first_name} {contact.last_name}
                        </p>
                        {contact.email && (
                          <p className="text-sm text-muted-foreground">{contact.email}</p>
                        )}
                        {contact.phone && (
                          <p className="text-sm text-muted-foreground">{contact.phone}</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-6">
            <NotesSection entityType="quote" entityId={id!} />
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <EntityActivityTab entityType="quote" entityId={id!} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default QuoteDetail;
