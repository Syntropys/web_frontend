import { supabase } from '@/lib/supabase'
import type { ClusterAssignment } from '@/types/database'

export const clustersService = {
  async list(referenceYear?: number): Promise<ClusterAssignment[]> {
    let query = supabase
      .from('cluster_assignments')
      .select('*, regions(name, province)')
      .order('cluster_label')

    if (referenceYear) {
      query = query.eq('reference_year', referenceYear)
    }
    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },

  async byRegion(regionId: string): Promise<ClusterAssignment[]> {
    const { data, error } = await supabase
      .from('cluster_assignments')
      .select('*')
      .eq('region_id', regionId)
      .order('reference_year', { ascending: false })
    if (error) throw error
    return data ?? []
  },
}
