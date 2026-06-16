import { supabase } from '@/lib/supabase'
import type { Prediction } from '@/types/database'

export const predictionsService = {
  async byRegion(regionId: string, modelName?: string): Promise<Prediction[]> {
    let query = supabase
      .from('predictions')
      .select('*')
      .eq('region_id', regionId)
      .order('target_year')

    if (modelName) {
      query = query.eq('model_name', modelName)
    }
    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },

  async baselineForAllRegions(): Promise<Prediction[]> {
    const { data, error } = await supabase
      .from('predictions')
      .select('*, regions(name, province)')
      .eq('is_baseline', true)
      .order('target_year')
    if (error) throw error
    return data ?? []
  },
}
