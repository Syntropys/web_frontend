import { DashboardLayout } from "../../components/dashboard-layout";
import { PriorityTableCard } from "../../components/dashboard-widgets";

export default function PrioritasPage() {
  return (
    <DashboardLayout
      pageTitle="Rekomendasi Prioritas"
      eyebrow="Rekomendasi"
      title="Rekomendasi Prioritas"
      description="Daftar wilayah prioritas berdasarkan estimasi produksi dan tingkat risiko."
    >
      <PriorityTableCard />
    </DashboardLayout>
  );
}
