import { supabase } from '@/lib/supabase'
import type { Region } from '@/types/database'

export const regionsService = {
  async list(): Promise<Region[]> {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .order('province')
      .order('name')
    if (error) throw error
    return data ?? []
  },

  async getById(id: string): Promise<Region | null> {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async getByProvince(province: string): Promise<Region[]> {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .eq('province', province)
      .order('name')
    if (error) throw error
    return data ?? []
  },
}
