import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface ProjectFilesProps {
  projectId: string;
}

const ProjectFiles = ({ projectId }: ProjectFilesProps) => {
  // TODO: Implement file storage integration when ready
  // This would connect to Supabase Storage or another file storage solution

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Files</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-center">
            File management will be available soon.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectFiles;
