import { useQuery } from '@tanstack/react-query'
import { clustersService } from '@/services/clusters'

export function useClusters(referenceYear?: number) {
  return useQuery({
    queryKey: ['clusters', referenceYear],
    queryFn: () => clustersService.list(referenceYear),
    staleTime: 10 * 60 * 1000,
  })
}

export function useClusterByRegion(regionId: string | null) {
  return useQuery({
    queryKey: ['clusters', 'region', regionId],
    queryFn: () => (regionId ? clustersService.byRegion(regionId) : []),
    enabled: !!regionId,
    staleTime: 10 * 60 * 1000,
  })
}
