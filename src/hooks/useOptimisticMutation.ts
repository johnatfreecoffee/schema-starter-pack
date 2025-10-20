import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

interface OptimisticUpdateOptions<TData, TVariables> extends UseMutationOptions<TData, Error, TVariables> {
  queryKey: string[];
  updateFn: (oldData: any, variables: TVariables) => any;
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Hook for optimistic updates with automatic rollback on error
 * Provides instant UI feedback while the mutation is in progress
 */
export function useOptimisticMutation<TData = unknown, TVariables = unknown>({
  queryKey,
  updateFn,
  successMessage,
  errorMessage = 'Operation failed',
  ...options
}: OptimisticUpdateOptions<TData, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    ...options,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update to the new value
      queryClient.setQueryData(queryKey, (old: any) => updateFn(old, variables));

      // Call user's onMutate if provided
      await options.onMutate?.(variables);

      // Return context with snapshot
      return { previousData };
    },
    onError: (error, variables, context: any) => {
      // Rollback to the previous value
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      toast.error(errorMessage);
      
      // Call user's onError if provided
      options.onError?.(error, variables, context);
    },
    onSuccess: (data, variables, context) => {
      if (successMessage) {
        toast.success(successMessage);
      }

      // Call user's onSuccess if provided
      options.onSuccess?.(data, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey });

      // Call user's onSettled if provided
      options.onSettled?.(data, error, variables, context);
    },
  });
}
