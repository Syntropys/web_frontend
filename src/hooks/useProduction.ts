import { useQuery } from '@tanstack/react-query'
import { productionService } from '@/services/production'

export function useProductionHistory(regionId: string | null, year?: number) {
  return useQuery({
    queryKey: ['production', regionId, year],
    queryFn: () =>
      regionId ? productionService.byRegion(regionId, year) : [],
    enabled: !!regionId,
    staleTime: 10 * 60 * 1000,
  })
}

export function useKalimantanSummary(year?: number) {
  return useQuery({
    queryKey: ['production-summary', year],
    queryFn: () => productionService.KalimantanSummary(year),
    staleTime: 10 * 60 * 1000,
  })
}
