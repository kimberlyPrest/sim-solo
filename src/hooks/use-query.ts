import { useState, useEffect, useCallback } from 'react'

export function useQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: { enabled?: boolean },
) {
  const [data, setData] = useState<T | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(options?.enabled !== false)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await queryFn()
      setData(res)
      setError(null)
    } catch (err: any) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }, [queryFn])

  useEffect(() => {
    if (options?.enabled !== false) {
      refetch()
    }
  }, [options?.enabled, queryKey.join('-')])

  return { data, isLoading, error, refetch }
}

export function useMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options?: { onSuccess?: () => void; onError?: (error: Error) => void },
) {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (variables: V) => {
    setIsPending(true)
    try {
      const res = await mutationFn(variables)
      options?.onSuccess?.()
      return res
    } catch (error: any) {
      options?.onError?.(error)
      throw error
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}
