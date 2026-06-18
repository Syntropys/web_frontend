import { DashboardLayout } from "../../components/dashboard-layout";
import { PredictionKpiCard } from "../../components/dashboard-widgets";

export default function PrediksiPage() {
  return (
    <DashboardLayout
      pageTitle="Prediksi Produksi"
      eyebrow="Prediksi"
      title="Proyeksi Produksi (XGBoost)"
      description="Estimasi produksi padi berbasis model XGBoost dengan tren musiman. Model terbaik dengan R²=0.986."
    >
      <PredictionKpiCard />
    </DashboardLayout>
  );
}
