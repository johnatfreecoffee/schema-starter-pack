import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TaskStatusBadge from "@/components/admin/tasks/TaskStatusBadge";
import TaskPriorityBadge from "@/components/admin/tasks/TaskPriorityBadge";
import NotesSection from "@/components/admin/notes/NotesSection";
import TaskForm from "@/components/admin/tasks/TaskForm";
import { format } from "date-fns";
import { CRUDLogger } from "@/lib/crudLogger";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<any>(null);
  const [assignedUser, setAssignedUser] = useState<any>(null);
  const [relatedEntity, setRelatedEntity] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    fetchTaskDetails();
    loadUsers();
  }, [id]);

  const loadUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email');
      
      if (error) throw error;
      
      const usersList = (data || []).map(user => ({
        id: user.id,
        first_name: user.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Unknown',
        last_name: user.full_name?.split(' ').slice(1).join(' ') || 'User'
      }));
      
      setUsers(usersList);
    } catch (error: any) {
      console.error('Error loading users:', error);
    }
  };

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);

      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (taskError) throw taskError;
      if (!taskData) {
        toast({
          title: "Not Found",
          description: "Task not found",
          variant: "destructive",
        });
        navigate("/dashboard/tasks");
        return;
      }

      setTask(taskData);

      // Fetch assigned user
      if (taskData.assigned_to) {
        const { data: userData } = await supabase.auth.admin.getUserById(taskData.assigned_to);
        if (userData?.user?.user_metadata) {
          setAssignedUser({
            first_name: userData.user.user_metadata.first_name || "Unknown",
            last_name: userData.user.user_metadata.last_name || "User",
          });
        }
      }

      // Fetch related entity
      if (taskData.related_to_type && taskData.related_to_id) {
        if (taskData.related_to_type === "lead") {
          const { data } = await supabase
            .from("leads")
            .select("first_name, last_name")
            .eq("id", taskData.related_to_id)
            .maybeSingle();
          if (data) setRelatedEntity(`${data.first_name} ${data.last_name}`);
        } else if (taskData.related_to_type === "account") {
          const { data } = await supabase
            .from("accounts")
            .select("account_name")
            .eq("id", taskData.related_to_id)
            .maybeSingle();
          if (data) setRelatedEntity(data.account_name);
        } else if (taskData.related_to_type === "project") {
          const { data } = await supabase
            .from("projects")
            .select("project_name")
            .eq("id", taskData.related_to_id)
            .maybeSingle();
          if (data) setRelatedEntity(data.project_name);
        }
      }
    } catch (error: any) {
      console.error("Error fetching task:", error);
      toast({
        title: "Error",
        description: "Failed to load task details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from("tasks").delete().eq("id", id);

      if (error) throw error;

      await CRUDLogger.logDelete({
        userId: user.id,
        entityType: 'task',
        entityId: id!,
        entityName: task?.title || 'Unknown'
      });

      toast({
        title: "Success",
        description: "Task deleted successfully",
      });

      navigate("/dashboard/tasks");
    } catch (error: any) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8">Loading task details...</div>
      </AdminLayout>
    );
  }

  if (!task) return null;

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard/tasks")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
        </div>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">{task.title}</h1>
            <div className="flex gap-2">
              <TaskPriorityBadge priority={task.priority} />
              <TaskStatusBadge status={task.status} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEditForm(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Task Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <TaskStatusBadge status={task.status} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Priority</p>
                      <TaskPriorityBadge priority={task.priority} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
                      <p className="text-sm">
                        {assignedUser
                          ? `${assignedUser.first_name} ${assignedUser.last_name}`
                          : "Unassigned"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                      <p className="text-sm">
                        {task.due_date
                          ? format(new Date(task.due_date), "MMM d, yyyy")
                          : "No due date"}
                      </p>
                    </div>
                    {task.related_to_type && relatedEntity && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Related To</p>
                        <p className="text-sm capitalize">
                          {task.related_to_type}: {relatedEntity}
                        </p>
                      </div>
                    )}
                    {task.completed_at && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Completed At</p>
                        <p className="text-sm">
                          {format(new Date(task.completed_at), "MMM d, yyyy h:mm a")}
                        </p>
                      </div>
                    )}
                  </div>
                  {task.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                      <p className="text-sm whitespace-pre-wrap">{task.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-6">
            <NotesSection entityType="task" entityId={id!} />
          </TabsContent>
        </Tabs>

        <TaskForm
          open={showEditForm}
          onClose={() => setShowEditForm(false)}
          task={task}
          users={users}
          currentUserId={currentUserId}
          onSuccess={() => {
            setShowEditForm(false);
            fetchTaskDetails();
          }}
        />

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Task</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this task? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default TaskDetail;
