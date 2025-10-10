export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_module: string;
  trigger_conditions: any;
  actions: Array<{
    action_type: string;
    action_config: any;
    execution_order: number;
    delay_minutes: number;
  }>;
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'new-lead-auto-response',
    name: 'New Lead Auto-Response',
    description: 'Automatically send a welcome email and create a follow-up task when a new lead is submitted from the website',
    trigger_type: 'record_created',
    trigger_module: 'leads',
    trigger_conditions: {
      conditions: [
        {
          field: 'source',
          operator: 'equals',
          value: 'web_form',
        },
      ],
    },
    actions: [
      {
        action_type: 'send_email',
        action_config: {
          recipient_type: 'record_email',
          subject: 'Thank you for contacting us, {{first_name}}!',
          body: 'Hi {{first_name}},\n\nThank you for reaching out to us. We received your request for {{service_needed}} and one of our team members will contact you within 24 hours.\n\nBest regards,\n{{company_name}}',
        },
        execution_order: 0,
        delay_minutes: 0,
      },
      {
        action_type: 'create_task',
        action_config: {
          title: 'Follow up with new lead: {{first_name}} {{last_name}}',
          description: 'Contact lead about {{service_needed}}. Phone: {{phone}}',
          assignee_type: 'round_robin',
          due_in_days: 1,
        },
        execution_order: 1,
        delay_minutes: 5,
      },
      {
        action_type: 'add_tag',
        action_config: {
          tag_name: 'New',
        },
        execution_order: 2,
        delay_minutes: 0,
      },
    ],
  },
  {
    id: 'project-completion-flow',
    name: 'Project Completion Flow',
    description: 'Send satisfaction survey, create invoice, and schedule follow-up when a project is completed',
    trigger_type: 'field_changed',
    trigger_module: 'projects',
    trigger_conditions: {
      conditions: [
        {
          field: 'status',
          operator: 'equals',
          value: 'completed',
        },
      ],
    },
    actions: [
      {
        action_type: 'send_email',
        action_config: {
          recipient_type: 'record_owner',
          subject: 'Project {{project_name}} Completed - Feedback Request',
          body: 'Hi,\n\nYour project "{{project_name}}" has been completed. We would love to hear your feedback!\n\nPlease take a moment to rate our service.\n\nThank you,\n{{company_name}}',
        },
        execution_order: 0,
        delay_minutes: 0,
      },
      {
        action_type: 'create_note',
        action_config: {
          content: 'Project completed on {{current_date}}. Follow-up scheduled for 30 days.',
        },
        execution_order: 1,
        delay_minutes: 0,
      },
      {
        action_type: 'create_task',
        action_config: {
          title: 'Follow-up: {{project_name}}',
          description: 'Check in with customer 30 days after project completion',
          assignee_type: 'record_owner',
          due_in_days: 30,
        },
        execution_order: 2,
        delay_minutes: 1440, // 24 hours
      },
    ],
  },
  {
    id: 'lead-nurturing-sequence',
    name: 'Lead Nurturing Sequence',
    description: 'Send a series of follow-up emails to cold leads over 2 weeks',
    trigger_type: 'record_created',
    trigger_module: 'leads',
    trigger_conditions: {
      conditions: [
        {
          field: 'status',
          operator: 'equals',
          value: 'cold',
        },
      ],
    },
    actions: [
      {
        action_type: 'send_email',
        action_config: {
          recipient_type: 'record_email',
          subject: 'Just checking in - {{company_name}}',
          body: 'Hi {{first_name}},\n\nI wanted to follow up on your inquiry about {{service_needed}}. Do you have any questions?\n\nBest,\n{{company_name}}',
        },
        execution_order: 0,
        delay_minutes: 1440, // Day 1
      },
      {
        action_type: 'send_email',
        action_config: {
          recipient_type: 'record_email',
          subject: 'How we can help with {{service_needed}}',
          body: 'Hi {{first_name}},\n\nI wanted to share some information about how we approach {{service_needed}} projects...',
        },
        execution_order: 1,
        delay_minutes: 4320, // Day 3
      },
      {
        action_type: 'send_email',
        action_config: {
          recipient_type: 'record_email',
          subject: 'Last check-in from {{company_name}}',
          body: 'Hi {{first_name}},\n\nThis is my last follow-up. If you\'re still interested in {{service_needed}}, please let me know.\n\nBest regards,\n{{company_name}}',
        },
        execution_order: 2,
        delay_minutes: 10080, // Day 7
      },
    ],
  },
  {
    id: 'task-overdue-alert',
    name: 'Task Overdue Alert',
    description: 'Send reminder to assignee and notify manager when a task becomes overdue',
    trigger_type: 'field_changed',
    trigger_module: 'tasks',
    trigger_conditions: {
      conditions: [
        {
          field: 'due_date',
          operator: 'less_than',
          value: '{{today}}',
        },
        {
          field: 'status',
          operator: 'not_equals',
          value: 'completed',
          logic: 'AND',
        },
      ],
    },
    actions: [
      {
        action_type: 'send_email',
        action_config: {
          recipient_type: 'assignee',
          subject: 'Task Overdue: {{title}}',
          body: 'This is a reminder that the task "{{title}}" is now overdue. Please update its status.',
        },
        execution_order: 0,
        delay_minutes: 0,
      },
      {
        action_type: 'update_field',
        action_config: {
          field_name: 'priority',
          field_value: 'high',
        },
        execution_order: 1,
        delay_minutes: 0,
      },
      {
        action_type: 'create_note',
        action_config: {
          content: 'Task became overdue. Priority automatically updated to high.',
        },
        execution_order: 2,
        delay_minutes: 0,
      },
    ],
  },
  {
    id: 'high-value-opportunity',
    name: 'High-Value Opportunity Alert',
    description: 'Notify sales manager and add priority tag when a high-value quote is created',
    trigger_type: 'record_created',
    trigger_module: 'quotes',
    trigger_conditions: {
      conditions: [
        {
          field: 'total_amount',
          operator: 'greater_than',
          value: '1000000', // $10,000 in cents
        },
      ],
    },
    actions: [
      {
        action_type: 'send_email',
        action_config: {
          recipient_type: 'specific_user',
          recipient_email: 'manager@company.com',
          subject: 'High-Value Quote Created: {{quote_number}}',
          body: 'A high-value quote ({{total_amount}}) has been created for {{account_name}}. Please review.',
        },
        execution_order: 0,
        delay_minutes: 0,
      },
      {
        action_type: 'add_tag',
        action_config: {
          tag_name: 'High Priority',
        },
        execution_order: 1,
        delay_minutes: 0,
      },
      {
        action_type: 'create_task',
        action_config: {
          title: 'Review high-value quote: {{quote_number}}',
          description: 'Quote for {{total_amount}} created for {{account_name}}. Requires manager approval.',
          assignee_type: 'specific_user',
          due_in_days: 1,
        },
        execution_order: 2,
        delay_minutes: 5,
      },
    ],
  },
];
