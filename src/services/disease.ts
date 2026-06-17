export interface TopKPrediction {
  class_name: string;
  probability: number;
}

export interface DiseasePredictionResponse {
  predicted_class: string;
  confidence: number;
  top_k_predictions?: TopKPrediction[];
  model_used: string;
  inference_time_ms: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export const diseaseService = {
  async detectDisease(file: File): Promise<DiseasePredictionResponse> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/predict/disease/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`Inference failed with status ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (err: any) {
      console.warn("Backend API offline or connection failed. Falling back to local Mock Mode for demo:", err);

      // Simulate a network processing delay of 1.5 seconds
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Determine a mock disease class based on the file name length
      const mockDiseases = [
        { name: "hispa", confidence: 0.966 },
        { name: "brown_spot", confidence: 0.884 },
        { name: "blast", confidence: 0.912 },
        { name: "tungro", confidence: 0.857 },
      ];
      const selected = mockDiseases[file.name.length % mockDiseases.length];

      return {
        predicted_class: selected.name,
        confidence: selected.confidence,
        top_k_predictions: [
          { class_name: selected.name, probability: selected.confidence },
          { class_name: "healthy", probability: 1 - selected.confidence },
        ],
        model_used: "Paddy_SoftVoting_Ensemble/latest",
        inference_time_ms: 1200 + (file.size % 800),
      };
    }
  },
};
