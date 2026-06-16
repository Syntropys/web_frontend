import { useQuery } from '@tanstack/react-query'
import { predictionsService } from '@/services/predictions'

export function usePredictions(regionId: string | null, modelName?: string) {
  return useQuery({
    queryKey: ['predictions', regionId, modelName],
    queryFn: () =>
      regionId ? predictionsService.byRegion(regionId, modelName) : [],
    enabled: !!regionId,
    staleTime: 60 * 1000,
  })
}

export function useBaselinePredictions() {
  return useQuery({
    queryKey: ['predictions', 'baseline'],
    queryFn: () => predictionsService.baselineForAllRegions(),
    staleTime: 60 * 1000,
  })
}
