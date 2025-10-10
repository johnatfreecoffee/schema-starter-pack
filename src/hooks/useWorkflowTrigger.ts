import { useCallback } from 'react';
import { workflowService } from '@/services/workflowService';

/**
 * Hook to trigger workflows when CRM events occur
 * Usage: Call triggerWorkflow after creating/updating records
 */
export const useWorkflowTrigger = () => {
  const triggerWorkflow = useCallback(
    async (params: {
      triggerType: 'record_created' | 'record_updated' | 'field_changed';
      module: string;
      recordId: string;
      recordData: any;
      previousData?: any;
    }) => {
      try {
        await workflowService.triggerWorkflows({
          workflow_id: '', // Will be determined by the service
          trigger_record_id: params.recordId,
          trigger_module: params.module,
          trigger_data: {
            ...params.recordData,
            entity_type: params.module,
            previous_data: params.previousData,
          },
        });
      } catch (error) {
        console.error('Error triggering workflow:', error);
      }
    },
    []
  );

  return { triggerWorkflow };
};
