export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'user'
          status: 'active' | 'suspended'
          preferred_theme: 'dark' | 'light'
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'user'
          status?: 'active' | 'suspended'
          preferred_theme?: 'dark' | 'light'
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'user'
          status?: 'active' | 'suspended'
          preferred_theme?: 'dark' | 'light'
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      regions: {
        Row: {
          id: string
          bps_code: string | null
          name: string
          province: string
          province_code: string | null
          centroid_lat: number | null
          centroid_lng: number | null
          area_km2: number | null
          geojson_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          bps_code?: string | null
          name: string
          province: string
          province_code?: string | null
          centroid_lat?: number | null
          centroid_lng?: number | null
          area_km2?: number | null
          geojson_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          bps_code?: string | null
          name?: string
          province?: string
          province_code?: string | null
          centroid_lat?: number | null
          centroid_lng?: number | null
          area_km2?: number | null
          geojson_id?: string | null
          created_at?: string
        }
      }
      production_history: {
        Row: {
          id: string
          region_id: string
          year: number
          month: number | null
          production_ton: number
          area_harvest_ha: number | null
          yield_ton_ha: number | null
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          region_id: string
          year: number
          month?: number | null
          production_ton: number
          area_harvest_ha?: number | null
          yield_ton_ha?: number | null
          source?: string
          created_at?: string
        }
        Update: {
          id?: string
          region_id?: string
          year?: number
          month?: number | null
          production_ton?: number
          area_harvest_ha?: number | null
          yield_ton_ha?: number | null
          source?: string
          created_at?: string
        }
      }
      weather_history: {
        Row: {
          id: string
          region_id: string
          year: number
          month: number
          rainfall_mm: number | null
          temp_avg_c: number | null
          temp_min_c: number | null
          temp_max_c: number | null
          humidity_pct: number | null
          solar_radiation: number | null
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          region_id: string
          year: number
          month: number
          rainfall_mm?: number | null
          temp_avg_c?: number | null
          temp_min_c?: number | null
          temp_max_c?: number | null
          humidity_pct?: number | null
          solar_radiation?: number | null
          source?: string
          created_at?: string
        }
        Update: {
          id?: string
          region_id?: string
          year?: number
          month?: number
          rainfall_mm?: number | null
          temp_avg_c?: number | null
          temp_min_c?: number | null
          temp_max_c?: number | null
          humidity_pct?: number | null
          solar_radiation?: number | null
          source?: string
          created_at?: string
        }
      }
      predictions: {
        Row: {
          id: string
          region_id: string
          target_year: number
          target_month: number | null
          predicted_yield: number
          predicted_prod_ton: number | null
          confidence_lower: number | null
          confidence_upper: number | null
          model_name: string | null
          model_version: string | null
          computed_at: string
          is_baseline: boolean
        }
        Insert: {
          id?: string
          region_id: string
          target_year: number
          target_month?: number | null
          predicted_yield: number
          predicted_prod_ton?: number | null
          confidence_lower?: number | null
          confidence_upper?: number | null
          model_name?: string | null
          model_version?: string | null
          computed_at?: string
          is_baseline?: boolean
        }
        Update: {
          id?: string
          region_id?: string
          target_year?: number
          target_month?: number | null
          predicted_yield?: number
          predicted_prod_ton?: number | null
          confidence_lower?: number | null
          confidence_upper?: number | null
          model_name?: string | null
          model_version?: string | null
          computed_at?: string
          is_baseline?: boolean
        }
      }
      cluster_assignments: {
        Row: {
          id: string
          region_id: string
          cluster_label: number
          cluster_name: string | null
          reference_year: number
          computed_at: string
        }
        Insert: {
          id?: string
          region_id: string
          cluster_label: number
          cluster_name?: string | null
          reference_year: number
          computed_at?: string
        }
        Update: {
          id?: string
          region_id?: string
          cluster_label?: number
          cluster_name?: string | null
          reference_year?: number
          computed_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          actor_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          metadata: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string | null
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Convenience re-exports
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Region = Database['public']['Tables']['regions']['Row']
export type ProductionHistory = Database['public']['Tables']['production_history']['Row']
export type WeatherHistory = Database['public']['Tables']['weather_history']['Row']
export type Prediction = Database['public']['Tables']['predictions']['Row']
export type ClusterAssignment = Database['public']['Tables']['cluster_assignments']['Row']
export type AuditLog = Database['public']['Tables']['audit_log']['Row']

export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProductionInsert = Database['public']['Tables']['production_history']['Insert']
export type PredictionInsert = Database['public']['Tables']['predictions']['Insert']
