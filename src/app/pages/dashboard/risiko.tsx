import { DashboardLayout } from "../../components/dashboard-layout";
import { RiskKpiCard } from "../../components/dashboard-widgets";

export default function RisikoPage() {
  return (
    <DashboardLayout
      pageTitle="Status Risiko"
      eyebrow="Risiko"
      title="Status Wilayah"
      description="Jumlah kabupaten yang masuk kategori risiko tinggi."
    >
      <RiskKpiCard />
    </DashboardLayout>
  );
}
