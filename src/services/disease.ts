export interface TopKPrediction {
  class_name: string;
  probability: number;
}

export interface DiseasePredictionResponse {
  predicted_class: string;
  confidence: number;
  top_k_predictions?: TopKPrediction[];
  model_used: string;
  inference_time_ms: number | null;
}

const API_BASE_URL = import.meta.env.VITE_DISEASE_API_URL || "";
const IS_CONFIGURED = API_BASE_URL.startsWith("https://") && !API_BASE_URL.includes("your-");

/**
 * Map of 10 model output class names → human-readable Indonesian labels.
 * Must match disease_classification README.md class index exactly.
 */
export const DISEASE_LABELS: Record<string, string> = {
  bacterial_blight: "Hawar Daun Bakteri",
  brown_spot: "Bercak Coklat",
  healthy: "Sehat (Normal)",
  hispa: "Hispa",
  leaf_blast: "Blas Daun",
  leaf_scald: "Hawar Pelepah Daun",
  leaf_smut: "Noda Hitam Daun",
  narrow_brown_spot: "Bercak Coklat Sempit",
  sheath_blight: "Hawar Pelepah",
  tungro: "Tungro",
};

/**
 * Get the human-readable Indonesian label for a predicted class.
 */
export function getDiseaseLabel(className: string): string {
  return DISEASE_LABELS[className] ?? className;
}

export const diseaseService = {
  isConfigured: IS_CONFIGURED,

  async detectDisease(file: File): Promise<DiseasePredictionResponse> {
    // Jika URL belum dikonfigurasi, langsung throw — jangan fallback ke mock
    if (!IS_CONFIGURED) {
      throw new Error(
        "API Railway belum dikonfigurasi. Set VITE_DISEASE_API_URL ke URL FastAPI Bridge Railway yang sebenarnya."
      );
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/predict/disease/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Inferensi gagal (${response.status}): ${errorText}`);
    }

    return await response.json();
  },
};
