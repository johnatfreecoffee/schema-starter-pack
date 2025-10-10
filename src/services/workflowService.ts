import { supabase } from '@/integrations/supabase/client';

export interface WorkflowExecution {
  workflow_id: string;
  trigger_record_id: string;
  trigger_module: string;
  trigger_data: any;
}

class WorkflowService {
  /**
   * Trigger workflows based on a record event
   */
  async triggerWorkflows(params: WorkflowExecution) {
    const { workflow_id, trigger_record_id, trigger_module, trigger_data } = params;

    try {
      // Find workflows that match this trigger
      const { data: workflows, error: workflowError } = await supabase
        .from('workflows')
        .select(`
          *,
          workflow_actions(*)
        `)
        .eq('is_active', true)
        .or(`trigger_module.eq.${trigger_module},trigger_module.is.null`)
        .order('created_at', { ascending: true });

      if (workflowError) throw workflowError;

      if (!workflows || workflows.length === 0) {
        console.log('No active workflows found for', trigger_module);
        return;
      }

      // Execute each matching workflow
      for (const workflow of workflows) {
        // Check if conditions match
        if (workflow.trigger_conditions) {
          const conditionsMet = this.evaluateConditions(
            workflow.trigger_conditions,
            trigger_data
          );

          if (!conditionsMet) {
            console.log(`Conditions not met for workflow ${workflow.id}`);
            continue;
          }
        }

        // Create execution record
        const { data: execution, error: executionError } = await supabase
          .from('workflow_executions')
          .insert({
            workflow_id: workflow.id,
            trigger_record_id,
            trigger_module,
            status: 'pending',
            execution_data: { trigger_data },
          })
          .select()
          .single();

        if (executionError) {
          console.error('Error creating execution:', executionError);
          continue;
        }

        // Execute workflow actions
        this.executeWorkflow(execution.id, workflow, trigger_data);
      }
    } catch (error) {
      console.error('Error triggering workflows:', error);
    }
  }

  /**
   * Execute a workflow's actions
   */
  private async executeWorkflow(
    executionId: string,
    workflow: any,
    triggerData: any
  ) {
    try {
      // Update status to running
      await supabase
        .from('workflow_executions')
        .update({ status: 'running' })
        .eq('id', executionId);

      const actions = workflow.workflow_actions.sort(
        (a: any, b: any) => a.execution_order - b.execution_order
      );

      // Execute actions in sequence
      for (const action of actions) {
        // Apply delay if specified
        if (action.delay_minutes > 0) {
          await this.delay(action.delay_minutes * 60 * 1000);
        }

        await this.executeAction(action, triggerData);
      }

      // Mark as completed
      await supabase
        .from('workflow_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', executionId);
    } catch (error: any) {
      console.error('Error executing workflow:', error);

      // Mark as failed
      await supabase
        .from('workflow_executions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message,
        })
        .eq('id', executionId);
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(action: any, triggerData: any) {
    const { action_type, action_config } = action;

    console.log(`Executing action: ${action_type}`, action_config);

    switch (action_type) {
      case 'send_email':
        await this.executeSendEmail(action_config, triggerData);
        break;

      case 'update_field':
        await this.executeUpdateField(action_config, triggerData);
        break;

      case 'create_task':
        await this.executeCreateTask(action_config, triggerData);
        break;

      case 'create_note':
        await this.executeCreateNote(action_config, triggerData);
        break;

      case 'assign_to_user':
        await this.executeAssignToUser(action_config, triggerData);
        break;

      case 'add_tag':
        await this.executeAddTag(action_config, triggerData);
        break;

      case 'webhook':
        await this.executeWebhook(action_config, triggerData);
        break;

      default:
        console.warn(`Unknown action type: ${action_type}`);
    }
  }

  private async executeSendEmail(config: any, triggerData: any) {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Replace variables in email content
    const subject = this.replaceVariables(config.subject, triggerData);
    const body = this.replaceVariables(config.body, triggerData);

    // Queue email
    await supabase.from('email_queue').insert({
      to_email: triggerData.email || config.recipient_email,
      subject,
      body,
      entity_type: triggerData.entity_type,
      entity_id: triggerData.id,
      created_by: user?.id,
    });
  }

  private async executeUpdateField(config: any, triggerData: any) {
    // This would update the field on the trigger record
    console.log('Update field:', config.field_name, 'to', config.field_value);
  }

  private async executeCreateTask(config: any, triggerData: any) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (config.due_in_days || 1));

    await supabase.from('tasks').insert({
      title: this.replaceVariables(config.title, triggerData),
      description: this.replaceVariables(config.description, triggerData),
      related_to_type: triggerData.entity_type as any,
      related_to_id: triggerData.id,
      assigned_to: config.assignee_id || user?.id,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'not_started' as any,
      priority: 'medium' as any,
      created_by: user?.id || '',
    });
  }

  private async executeCreateNote(config: any, triggerData: any) {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('notes').insert({
      content: this.replaceVariables(config.content, triggerData),
      related_to_type: triggerData.entity_type,
      related_to_id: triggerData.id,
      created_by: user?.id,
    });
  }

  private async executeAssignToUser(config: any, triggerData: any) {
    // This would handle assignment logic
    console.log('Assign to user:', config.assignment_method);
  }

  private async executeAddTag(config: any, triggerData: any) {
    // This would add a tag to the record
    console.log('Add tag:', config.tag_name);
  }

  private async executeWebhook(config: any, triggerData: any) {
    try {
      const payload = config.payload
        ? JSON.parse(this.replaceVariables(config.payload, triggerData))
        : triggerData;

      await fetch(config.url, {
        method: config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.headers || {}),
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Webhook error:', error);
      throw error;
    }
  }

  /**
   * Evaluate conditions against trigger data
   */
  private evaluateConditions(conditions: any, triggerData: any): boolean {
    if (!conditions?.conditions || conditions.conditions.length === 0) {
      return true;
    }

    let result = true;
    let currentLogic: 'AND' | 'OR' = 'AND';

    for (const condition of conditions.conditions) {
      const fieldValue = triggerData[condition.field];
      const conditionMet = this.evaluateSingleCondition(
        fieldValue,
        condition.operator,
        condition.value
      );

      if (currentLogic === 'AND') {
        result = result && conditionMet;
      } else {
        result = result || conditionMet;
      }

      currentLogic = condition.logic || 'AND';
    }

    return result;
  }

  private evaluateSingleCondition(
    fieldValue: any,
    operator: string,
    compareValue: string
  ): boolean {
    switch (operator) {
      case 'equals':
        return String(fieldValue) === compareValue;
      case 'not_equals':
        return String(fieldValue) !== compareValue;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(compareValue.toLowerCase());
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(compareValue.toLowerCase());
      case 'greater_than':
        return Number(fieldValue) > Number(compareValue);
      case 'less_than':
        return Number(fieldValue) < Number(compareValue);
      case 'is_empty':
        return !fieldValue || String(fieldValue).trim() === '';
      case 'is_not_empty':
        return fieldValue && String(fieldValue).trim() !== '';
      default:
        return false;
    }
  }

  /**
   * Replace variables in text with actual data
   */
  private replaceVariables(text: string, data: any): string {
    if (!text) return '';

    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const workflowService = new WorkflowService();
