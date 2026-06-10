export const ADMIN_CREDENTIAL = {
  email: "admin@agrolytics.id",
  password: "Admin@2026",
  nama: "Administrator Agrolytics",
  wilayah: "Pusat",
};

export function isAdminCredential(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === ADMIN_CREDENTIAL.email.toLowerCase() &&
    password === ADMIN_CREDENTIAL.password
  );
}
