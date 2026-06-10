import { DashboardLayout } from "../../components/dashboard-layout";
import { ClimateKpiCard } from "../../components/dashboard-widgets";

export default function IklimPage() {
  return (
    <DashboardLayout
      pageTitle="Iklim"
      eyebrow="Iklim"
      title="Rata-Rata Iklim Wilayah"
      description="Indikator iklim agregat dari sumber data NASA POWER."
    >
      <ClimateKpiCard />
    </DashboardLayout>
  );
}
