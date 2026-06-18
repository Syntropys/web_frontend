import { DashboardLayout } from "../../components/dashboard-layout";
import { TrendChartCard } from "../../components/dashboard-widgets";

export default function TrenPage() {
  return (
    <DashboardLayout
      pageTitle="Tren Historis"
      eyebrow="Tren"
      title="Historis BPS vs Prediksi XGBoost"
      description="Perbandingan produksi historis BPS dengan proyeksi model XGBoost (best model, R²=0.986)."
    >
      <TrendChartCard />
    </DashboardLayout>
  );
}
