import { DashboardLayout } from "../../components/dashboard-layout";
import { PredictionKpiCard } from "../../components/dashboard-widgets";

export default function PrediksiPage() {
  return (
    <DashboardLayout
      pageTitle="Prediksi Produksi"
      eyebrow="Prediksi"
      title="Proyeksi Produksi (LSTM)"
      description="Estimasi produksi padi berbasis model LSTM dengan tren musiman."
    >
      <PredictionKpiCard />
    </DashboardLayout>
  );
}
