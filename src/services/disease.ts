/**
 * Disease Detection Service
 *
 * Wraps the apiClient to call the FastAPI disease classification endpoint.
 * Endpoint: POST /api/predict/disease/upload (multipart file upload)
 */
import { apiClient } from '@/lib/api'
import type { DiseasePredictionResponse } from '@/types/api-types'

/**
 * Upload a paddy leaf image for disease classification.
 *
 * @param file - The image file (PNG/JPG, max 5MB)
 * @returns Disease prediction result from the Soft Voting Ensemble model
 * @throws Error if the backend is unreachable or returns an error
 */
export async function detectDisease(
  file: File,
): Promise<DiseasePredictionResponse> {
  // Validate file before sending
  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar (PNG, JPG, JPEG).')
  }

  const MAX_SIZE_MB = 5
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`Ukuran file maksimal ${MAX_SIZE_MB}MB.`)
  }

  return apiClient.upload<DiseasePredictionResponse>(
    '/api/predict/disease/upload',
    file,
  )
}

/**
 * Map of disease class names to human-readable Indonesian labels.
 */
export const DISEASE_LABELS: Record<string, string> = {
  bacterial_blight: 'Hawar Daun Bakteri',
  bacterial_leaf_streak: 'Garis Daun Bakteri',
  blast: 'Blas',
  brown_spot: 'Bercak Cokelat',
  dead_heart: 'Sundep',
  downy_mildew: 'Embun Bulu',
  hispa: 'Hispa',
  normal: 'Sehat (Normal)',
  tungro: 'Tungro',
}

/**
 * Get the human-readable label for a predicted class.
 */
export function getDiseaseLabel(className: string): string {
  return DISEASE_LABELS[className] ?? className
}
