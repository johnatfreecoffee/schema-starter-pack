import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2, Mail, FileEdit, CheckSquare, FileText, UserPlus, Tag, Webhook } from 'lucide-react';

interface WorkflowAction {
  action_type: string;
  action_config: any;
  execution_order: number;
  delay_minutes: number;
}

interface WorkflowActionCardProps {
  action: WorkflowAction;
  index: number;
  onUpdate: (action: WorkflowAction) => void;
  onRemove: () => void;
}

const actionTypes = [
  { id: 'send_email', label: 'Send Email', icon: Mail },
  { id: 'update_field', label: 'Update Field', icon: FileEdit },
  { id: 'create_task', label: 'Create Task', icon: CheckSquare },
  { id: 'create_note', label: 'Create Note', icon: FileText },
  { id: 'assign_to_user', label: 'Assign to User', icon: UserPlus },
  { id: 'add_tag', label: 'Add Tag', icon: Tag },
  { id: 'webhook', label: 'Webhook', icon: Webhook },
];

export const WorkflowActionCard = ({
  action,
  index,
  onUpdate,
  onRemove,
}: WorkflowActionCardProps) => {
  const [config, setConfig] = useState(action.action_config || {});
  const [delayMinutes, setDelayMinutes] = useState(action.delay_minutes || 0);

  const selectedActionType = actionTypes.find(a => a.id === action.action_type);
  const Icon = selectedActionType?.icon || Mail;

  const updateConfig = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onUpdate({
      ...action,
      action_config: newConfig,
    });
  };

  const updateDelay = (minutes: number) => {
    setDelayMinutes(minutes);
    onUpdate({
      ...action,
      delay_minutes: minutes,
    });
  };

  const renderActionConfig = () => {
    switch (action.action_type) {
      case 'send_email':
        return (
          <>
            <div>
              <Label htmlFor={`email-to-${index}`}>Recipient</Label>
              <Select
                value={config.recipient_type || 'record_owner'}
                onValueChange={(value) => updateConfig('recipient_type', value)}
              >
                <SelectTrigger id={`email-to-${index}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="record_owner">Record Owner</SelectItem>
                  <SelectItem value="specific_user">Specific User</SelectItem>
                  <SelectItem value="record_email">Email from Record</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor={`email-template-${index}`}>Email Template</Label>
              <Input
                id={`email-template-${index}`}
                value={config.template_id || ''}
                onChange={(e) => updateConfig('template_id', e.target.value)}
                placeholder="Select or enter template ID"
              />
            </div>
            <div>
              <Label htmlFor={`email-subject-${index}`}>Subject</Label>
              <Input
                id={`email-subject-${index}`}
                value={config.subject || ''}
                onChange={(e) => updateConfig('subject', e.target.value)}
                placeholder="Email subject"
              />
            </div>
            <div>
              <Label htmlFor={`email-body-${index}`}>Body</Label>
              <Textarea
                id={`email-body-${index}`}
                value={config.body || ''}
                onChange={(e) => updateConfig('body', e.target.value)}
                placeholder="Email body with {{variables}}"
                rows={4}
              />
            </div>
          </>
        );

      case 'update_field':
        return (
          <>
            <div>
              <Label htmlFor={`field-name-${index}`}>Field Name</Label>
              <Input
                id={`field-name-${index}`}
                value={config.field_name || ''}
                onChange={(e) => updateConfig('field_name', e.target.value)}
                placeholder="e.g., status"
              />
            </div>
            <div>
              <Label htmlFor={`field-value-${index}`}>New Value</Label>
              <Input
                id={`field-value-${index}`}
                value={config.field_value || ''}
                onChange={(e) => updateConfig('field_value', e.target.value)}
                placeholder="New value"
              />
            </div>
          </>
        );

      case 'create_task':
        return (
          <>
            <div>
              <Label htmlFor={`task-title-${index}`}>Task Title</Label>
              <Input
                id={`task-title-${index}`}
                value={config.title || ''}
                onChange={(e) => updateConfig('title', e.target.value)}
                placeholder="Task title"
              />
            </div>
            <div>
              <Label htmlFor={`task-description-${index}`}>Description</Label>
              <Textarea
                id={`task-description-${index}`}
                value={config.description || ''}
                onChange={(e) => updateConfig('description', e.target.value)}
                placeholder="Task description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor={`task-assignee-${index}`}>Assign To</Label>
              <Select
                value={config.assignee_type || 'record_owner'}
                onValueChange={(value) => updateConfig('assignee_type', value)}
              >
                <SelectTrigger id={`task-assignee-${index}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="record_owner">Record Owner</SelectItem>
                  <SelectItem value="specific_user">Specific User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor={`task-due-${index}`}>Due Date (days from now)</Label>
              <Input
                id={`task-due-${index}`}
                type="number"
                value={config.due_in_days || 1}
                onChange={(e) => updateConfig('due_in_days', parseInt(e.target.value))}
              />
            </div>
          </>
        );

      case 'create_note':
        return (
          <div>
            <Label htmlFor={`note-content-${index}`}>Note Content</Label>
            <Textarea
              id={`note-content-${index}`}
              value={config.content || ''}
              onChange={(e) => updateConfig('content', e.target.value)}
              placeholder="Note content with {{variables}}"
              rows={4}
            />
          </div>
        );

      case 'assign_to_user':
        return (
          <div>
            <Label htmlFor={`assign-method-${index}`}>Assignment Method</Label>
            <Select
              value={config.assignment_method || 'round_robin'}
              onValueChange={(value) => updateConfig('assignment_method', value)}
            >
              <SelectTrigger id={`assign-method-${index}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="round_robin">Round Robin</SelectItem>
                <SelectItem value="specific_user">Specific User</SelectItem>
                <SelectItem value="territory_based">Territory Based</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'add_tag':
        return (
          <div>
            <Label htmlFor={`tag-name-${index}`}>Tag Name</Label>
            <Input
              id={`tag-name-${index}`}
              value={config.tag_name || ''}
              onChange={(e) => updateConfig('tag_name', e.target.value)}
              placeholder="Tag to add"
            />
          </div>
        );

      case 'webhook':
        return (
          <>
            <div>
              <Label htmlFor={`webhook-url-${index}`}>Webhook URL</Label>
              <Input
                id={`webhook-url-${index}`}
                value={config.url || ''}
                onChange={(e) => updateConfig('url', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor={`webhook-method-${index}`}>HTTP Method</Label>
              <Select
                value={config.method || 'POST'}
                onValueChange={(value) => updateConfig('method', value)}
              >
                <SelectTrigger id={`webhook-method-${index}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor={`webhook-payload-${index}`}>Payload (JSON)</Label>
              <Textarea
                id={`webhook-payload-${index}`}
                value={config.payload || ''}
                onChange={(e) => updateConfig('payload', e.target.value)}
                placeholder='{"key": "{{value}}"}'
                rows={4}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-semibold">Action {index + 1}</div>
              <Select
                value={action.action_type}
                onValueChange={(value) =>
                  onUpdate({
                    ...action,
                    action_type: value,
                    action_config: {},
                  })
                }
              >
                <SelectTrigger className="w-[200px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderActionConfig()}
        
        <div>
          <Label htmlFor={`delay-${index}`}>Delay (minutes)</Label>
          <Input
            id={`delay-${index}`}
            type="number"
            min="0"
            value={delayMinutes}
            onChange={(e) => updateDelay(parseInt(e.target.value) || 0)}
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Wait this many minutes before executing this action
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
