import { useQuery } from '@tanstack/react-query'
import { auditService } from '@/services/audit'

export function useAuditLog(limit = 50) {
  return useQuery({
    queryKey: ['admin', 'audit', limit],
    queryFn: () => auditService.list({ limit }),
    staleTime: 30 * 1000,
  })
}
