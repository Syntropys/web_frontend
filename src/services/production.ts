import { supabase } from '@/lib/supabase'
import type { ProductionHistory } from '@/types/database'

export const productionService = {
  async byRegion(regionId: string, year?: number): Promise<ProductionHistory[]> {
    let query = supabase
      .from('production_history')
      .select('*')
      .eq('region_id', regionId)
      .order('year')
      .order('month')

    if (year) {
      query = query.eq('year', year)
    }
    const { data, error } = await query
    if (error) throw error
    return data ?? []
  },

  async multiRegionByYears(regionIds: string[], years: number[]): Promise<ProductionHistory[]> {
    const { data, error } = await supabase
      .from('production_history')
      .select('*')
      .in('region_id', regionIds)
      .in('year', years)
      .order('year')
    if (error) throw error
    return data ?? []
  },

  async KalimantanSummary(year?: number): Promise<{ total_prod_ton: number; total_ha: number; avg_yield: number }> {
    let query = supabase
      .from('production_history')
      .select('production_ton, area_harvest_ha, yield_ton_ha')

    if (year) {
      query = query.eq('year', year)
    }

    const { data, error } = await query
    if (error) throw error

    const rows = data ?? []
    const totalProd = rows.reduce((s, r) => s + (r.production_ton ?? 0), 0)
    const totalHa = rows.reduce((s, r) => s + (r.area_harvest_ha ?? 0), 0)
    const yields = rows.filter((r) => r.yield_ton_ha != null).map((r) => r.yield_ton_ha!)
    const avgYield = yields.length > 0 ? yields.reduce((s, v) => s + v, 0) / yields.length : 0

    return { total_prod_ton: totalProd, total_ha: totalHa, avg_yield: avgYield }
  },
}
