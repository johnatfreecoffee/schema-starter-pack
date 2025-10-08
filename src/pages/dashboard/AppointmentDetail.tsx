import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, MapPin, Phone, Video, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import NotesSection from "@/components/admin/notes/NotesSection";
import ActivityFeed from "@/components/admin/ActivityFeed";
import { format } from "date-fns";

const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<any>(null);

  useEffect(() => {
    fetchAppointmentDetails();
  }, [id]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("calendar_events")
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

      if (error) throw error;
      if (!data) {
        toast({
          title: "Not Found",
          description: "Appointment not found",
          variant: "destructive",
        });
        navigate("/dashboard/appointments");
        return;
      }

      setAppointment(data);
    } catch (error: any) {
      console.error("Error fetching appointment:", error);
      toast({
        title: "Error",
        description: "Failed to load appointment details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      requested: "outline",
      scheduled: "default",
      completed: "secondary",
      canceled: "destructive",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "onsite":
        return <MapPin className="h-4 w-4" />;
      case "virtual":
        return <Video className="h-4 w-4" />;
      case "phone":
        return <Phone className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8">Loading appointment details...</div>
      </AdminLayout>
    );
  }

  if (!appointment) return null;

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard/appointments")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Appointments
          </Button>
        </div>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">{appointment.title}</h1>
            <div className="flex gap-2 items-center">
              {getStatusBadge(appointment.status)}
              <Badge variant="outline" className="flex items-center gap-1">
                {getTypeIcon(appointment.appointment_type)}
                {appointment.appointment_type}
              </Badge>
            </div>
          </div>
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
                  <CardTitle>Appointment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">
                          {format(new Date(appointment.start_time), "MMMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Time</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">
                          {format(new Date(appointment.start_time), "h:mm a")} -{" "}
                          {format(new Date(appointment.end_time), "h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Type</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getTypeIcon(appointment.appointment_type)}
                        <p className="text-sm capitalize">{appointment.appointment_type}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <div className="mt-1">{getStatusBadge(appointment.status)}</div>
                    </div>
                    {appointment.location && (
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Location</p>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">{appointment.location}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {appointment.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                      <p className="text-sm whitespace-pre-wrap">{appointment.description}</p>
                    </div>
                  )}
                  {appointment.notes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Appointment Notes
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{appointment.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {appointment.accounts && (
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Account</p>
                      <p className="text-sm">{appointment.accounts.account_name}</p>
                    </div>
                    {appointment.accounts.contacts && appointment.accounts.contacts.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Contact Information
                        </p>
                        {appointment.accounts.contacts.map((contact: any, index: number) => (
                          <div key={index} className="space-y-1">
                            <p className="text-sm">
                              <Users className="inline h-4 w-4 mr-2" />
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
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-6">
            <NotesSection entityType="appointment" entityId={id!} />
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity History</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityFeed entityType="appointment" entityId={id!} limit={50} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AppointmentDetail;
