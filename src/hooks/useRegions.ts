import { useQuery } from '@tanstack/react-query'
import { regionsService } from '@/services/regions'

export function useRegions() {
  return useQuery({
    queryKey: ['regions'],
    queryFn: () => regionsService.list(),
    staleTime: 10 * 60 * 1000,
  })
}

export function useRegion(id: string | null) {
  return useQuery({
    queryKey: ['regions', id],
    queryFn: () => (id ? regionsService.getById(id) : null),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  })
}
