import { DashboardLayout } from "../../components/dashboard-layout";
import { DiseaseDetectionCard } from "../../components/dashboard-widgets";

export default function PenyakitPage() {
  return (
    <DashboardLayout
      pageTitle="Deteksi Penyakit"
      eyebrow="Deteksi"
      title="Diagnosis Penyakit Cepat"
      description="Unggah foto daun untuk mendapatkan diagnosis penyakit secara cepat."
    >
      <DiseaseDetectionCard />
    </DashboardLayout>
  );
}
