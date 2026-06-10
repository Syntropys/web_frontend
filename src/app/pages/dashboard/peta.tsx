import { DashboardLayout } from "../../components/dashboard-layout";
import { SpatialMapCard } from "../../components/dashboard-widgets";

export default function PetaPage() {
  return (
    <DashboardLayout
      pageTitle="Peta Spasial"
      eyebrow="Peta"
      title="Distribusi Kerentanan Spasial"
      description="Visualisasi sebaran kerentanan per wilayah administratif."
    >
      <SpatialMapCard />
    </DashboardLayout>
  );
}
