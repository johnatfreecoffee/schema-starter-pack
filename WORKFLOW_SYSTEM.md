# Workflow Automation System - Implementation Guide

## Overview
The workflow automation system allows administrators to create "if this, then that" style automations across the CRM. Workflows are triggered by events like record creation, updates, or field changes, and can perform various actions like sending emails, creating tasks, updating records, etc.

## Database Schema

### Tables Created
1. **workflows** - Stores workflow definitions
   - `id`, `name`, `description`
   - `trigger_type`: record_created, record_updated, field_changed, time_based, form_submitted
   - `trigger_module`: leads, accounts, projects, etc.
   - `trigger_conditions`: JSONB conditions for filtering
   - `is_active`: Boolean to enable/disable

2. **workflow_actions** - Individual actions within a workflow
   - `workflow_id`: Foreign key to workflows
   - `action_type`: send_email, update_field, create_task, create_note, assign_to_user, add_tag, webhook
   - `action_config`: JSONB configuration for the action
   - `execution_order`: Order of execution
   - `delay_minutes`: Delay before executing

3. **workflow_executions** - Execution history
   - `workflow_id`: Which workflow ran
   - `trigger_record_id`: Record that triggered it
   - `status`: pending, running, completed, failed
   - `error_message`: Error details if failed

## User Interface

### Main Pages

1. **Workflows List** (`/admin/automation/workflows`)
   - View all workflows with stats
   - Toggle active/inactive
   - Edit, duplicate, or delete workflows
   - Create new workflows

2. **Workflow Builder** (`/admin/automation/workflows/:id`)
   - Step-by-step visual builder
   - Select trigger type and module
   - Add conditions with AND/OR logic
   - Add multiple actions in sequence
   - Set delays between actions

3. **Workflow Monitor** (`/admin/automation/monitor`)
   - Real-time execution feed
   - Success/failure statistics
   - Error logs with details
   - Filter by workflow or status

4. **Workflow Templates** (`/admin/automation/templates`)
   - 5 pre-built templates ready to use:
     - New Lead Auto-Response
     - Project Completion Flow
     - Lead Nurturing Sequence
     - Task Overdue Alert
     - High-Value Opportunity Alert

5. **Workflow Testing** (`/admin/automation/testing`)
   - Test workflows without performing actual actions
   - Provide sample data
   - See step-by-step execution
   - Preview emails and validate conditions

## Workflow Components

### Trigger Types
- **Record Created**: When a new record is added to any module
- **Record Updated**: When any field on a record changes
- **Field Changed**: When a specific field changes to a specific value
- **Time-Based**: Run on a schedule (daily, weekly, monthly)
- **Form Submitted**: When a lead form is submitted

### Action Types
1. **Send Email**
   - Select recipient (record owner, specific user, email from record)
   - Use email templates or custom content
   - Variable substitution ({{first_name}}, {{company_name}}, etc.)

2. **Update Field**
   - Set field to static value or copy from another field
   - Support for incrementing numbers, appending text

3. **Create Task**
   - Auto-fill task details
   - Assign to user (specific, round-robin, record owner)
   - Set due date relative to trigger

4. **Create Note**
   - Add notes to triggered record
   - Template-based with variable substitution

5. **Assign to User**
   - Round-robin assignment
   - Specific user
   - Territory-based rules

6. **Add Tag**
   - Categorize records automatically

7. **Webhook**
   - Send data to external URLs
   - Custom payload with variable substitution
   - Support for authentication

### Conditions Builder
- Add multiple conditions with AND/OR logic
- Operators: equals, not equals, contains, not contains, greater than, less than, is empty, is not empty
- Field-based conditions using actual module fields

## Integration with CRM

### Triggering Workflows from Code

Use the `useWorkflowTrigger` hook:

```typescript
import { useWorkflowTrigger } from '@/hooks/useWorkflowTrigger';

const MyComponent = () => {
  const { triggerWorkflow } = useWorkflowTrigger();

  const handleCreateLead = async (leadData) => {
    // Create the lead
    const { data: lead } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    // Trigger workflows
    await triggerWorkflow({
      triggerType: 'record_created',
      module: 'leads',
      recordId: lead.id,
      recordData: lead,
    });
  };
};
```

### Modules That Should Trigger Workflows
- Leads
- Accounts
- Contacts
- Projects
- Tasks
- Appointments (calendar_events)
- Quotes
- Invoices

### Adding Workflow Triggers to Existing Code

Add workflow triggers after successful CRUD operations:

```typescript
// After creating a record
await triggerWorkflow({
  triggerType: 'record_created',
  module: 'leads',
  recordId: newRecord.id,
  recordData: newRecord,
});

// After updating a record
await triggerWorkflow({
  triggerType: 'record_updated',
  module: 'projects',
  recordId: record.id,
  recordData: updatedRecord,
  previousData: oldRecord,
});
```

## Workflow Service

The `workflowService` handles:
- Finding workflows that match triggers
- Evaluating conditions
- Executing actions in sequence
- Handling delays between actions
- Error handling and retry logic
- Variable substitution

## Variable Substitution

Use `{{variable_name}}` syntax in:
- Email subjects and bodies
- Task titles and descriptions
- Note content
- Webhook payloads

Available variables come from the trigger record data (e.g., `{{first_name}}`, `{{email}}`, `{{project_name}}`).

## Permission System

- Only admins can create/edit workflows
- CRM users can view workflows but not modify
- Workflows respect module-level permissions
- Users can only create workflows for modules they have access to

## Testing Workflows

1. Navigate to Workflow Testing interface
2. Select a workflow to test
3. Provide sample JSON data
4. Run test to see step-by-step execution
5. No actual actions are performed in test mode
6. Preview emails and validate conditions

## Performance Considerations

- Workflows execute asynchronously
- Actions are processed sequentially within a workflow
- Delays are properly handled
- Failed workflows are logged for debugging
- Database indexes optimize query performance

## Security

- RLS policies protect workflow tables
- Only authenticated users can trigger workflows
- Webhook URLs should be validated
- Email content is sanitized
- No SQL injection vulnerabilities in condition evaluation

## Future Enhancements

1. Scheduled workflows (cron-based)
2. Workflow analytics and reporting
3. A/B testing for email actions
4. Integration with external services (Zapier, Make)
5. Advanced condition builder with custom logic
6. Workflow versioning and rollback
7. Workflow marketplace/sharing

## Troubleshooting

### Workflow Not Triggering
- Check if workflow is active
- Verify trigger conditions are met
- Check workflow execution logs
- Ensure the module is configured correctly

### Action Failing
- Check execution error logs
- Verify action configuration
- Test in testing mode first
- Check email templates exist
- Verify webhook URLs are accessible

### Performance Issues
- Review number of active workflows
- Check for circular workflow triggers
- Optimize condition evaluation
- Consider batching similar actions

## Access Links

- Workflows: `/admin/automation/workflows`
- Templates: `/admin/automation/templates`
- Monitor: `/admin/automation/monitor`
- Testing: `/admin/automation/testing`
- Dashboard card: Click "Workflows" on main dashboard
