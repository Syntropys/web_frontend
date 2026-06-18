/**
 * TypeScript interfaces mirroring the FastAPI Pydantic schemas
 * from ml_service/fastapi/schemas/*.py
 *
 * These types ensure type-safe communication between the frontend
 * and the Paddy ML Bridge API.
 */

// ---------------------------------------------------------------------------
// Disease Prediction (maps to schemas/predict.py)
// ---------------------------------------------------------------------------

export interface TopKPrediction {
  class_name: string
  probability: number
}

export interface DiseasePredictionResponse {
  predicted_class: string
  confidence: number
  top_k_predictions: TopKPrediction[]
  model_used: string
  inference_time_ms: number | null
}

// ---------------------------------------------------------------------------
// Yield Prediction (maps to schemas/predict.py)
// ---------------------------------------------------------------------------

export interface YieldPredictionRequest {
  region_id: string
  year: number
  model: 'lstm' | 'xgboost' | 'random_forest' | 'linear'
}

export interface YieldPredictionResponse {
  predicted_yield: number
  predicted_prod_ton: number
  confidence_lower: number
  confidence_upper: number
  model_version: string
}

// ---------------------------------------------------------------------------
// Forecast (maps to schemas/forecast.py)
// ---------------------------------------------------------------------------

export interface ForecastJobResponse {
  job_id: string
  status: string
  message?: string
  result?: Record<string, unknown>
  error?: string
}

// ---------------------------------------------------------------------------
// Health (maps to schemas/common.py)
// ---------------------------------------------------------------------------

export interface ServiceHealth {
  name: string
  status: 'ok' | 'down' | 'degraded'
  latency_ms?: number
}

export interface HealthResponse {
  status: 'ok' | 'degraded'
  version: string
  services: ServiceHealth[]
}
