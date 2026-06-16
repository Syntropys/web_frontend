import { useQuery } from '@tanstack/react-query'
import { productionService } from '@/services/production'

export function useKalimantanSummary(year: number) {
  return useQuery({
    queryKey: ['production', 'kalimantan', year],
    queryFn: () => productionService.KalimantanSummary(year),
    staleTime: 10 * 60 * 1000,
  })
}
