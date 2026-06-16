import { supabase } from '@/lib/supabase'
import type { AuditLog } from '@/types/database'

export type { AuditLog }

export const auditService = {
  async list(opts?: { limit?: number }): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(opts?.limit ?? 50)
    if (error) throw error
    return data ?? []
  },
}
