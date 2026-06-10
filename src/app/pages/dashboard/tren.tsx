import { DashboardLayout } from "../../components/dashboard-layout";
import { TrendChartCard } from "../../components/dashboard-widgets";

export default function TrenPage() {
  return (
    <DashboardLayout
      pageTitle="Tren Historis"
      eyebrow="Tren"
      title="Historis BPS vs Prediksi LSTM"
      description="Perbandingan produksi historis BPS dengan proyeksi model LSTM."
    >
      <TrendChartCard />
    </DashboardLayout>
  );
}
