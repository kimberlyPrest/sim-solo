import {
  useMutation as useTanStackMutation,
  useQuery as useTanStackQuery,
  type QueryKey,
} from '@tanstack/react-query'

export function useQuery<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options?: { enabled?: boolean },
) {
  return useTanStackQuery({
    queryKey,
    queryFn,
    enabled: options?.enabled,
  })
}

export function useMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options?: { onSuccess?: () => void; onError?: (error: Error) => void },
) {
  return useTanStackMutation({
    mutationFn,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })
}
