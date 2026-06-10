import { z } from "zod";

const namaSchema = z
  .string()
  .trim()
  .min(3, "Min. 3 karakter")
  .max(80, "Terlalu panjang")
  .regex(/^[a-zA-Z\s.'-]+$/, "Hanya huruf & spasi");

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Wajib diisi")
  .email("Format email salah")
  .max(120, "Terlalu panjang");

const passwordLoginSchema = z
  .string()
  .min(6, "Min. 6 karakter")
  .max(128, "Terlalu panjang");

const passwordStrongSchema = z
  .string()
  .min(8, "Min. 8 karakter")
  .max(128, "Terlalu panjang")
  .regex(/[A-Z]/, "Butuh 1 huruf besar")
  .regex(/[a-z]/, "Butuh 1 huruf kecil")
  .regex(/[0-9]/, "Butuh 1 angka");

export const LoginSchema = z.object({
  email: emailSchema,
  password: passwordLoginSchema,
});

export const DaftarSchema = z.object({
  nama: namaSchema,
  email: emailSchema,
  password: passwordStrongSchema,
  setuju: z.literal(true, { message: "Anda harus menyetujui Syarat & Privasi" }),
});

export const AddUserSchema = z.object({
  nama: namaSchema,
  email: emailSchema,
  role: z.enum(["Admin", "Publik"]),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type DaftarInput = z.infer<typeof DaftarSchema>;
export type AddUserInput = z.infer<typeof AddUserSchema>;

export function fieldErrors<T extends z.ZodType>(result: z.SafeParseReturnType<unknown, z.infer<T>>) {
  if (result.success) return {} as Record<string, string>;
  const errs: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0]?.toString() ?? "_";
    if (!errs[key]) errs[key] = issue.message;
  }
  return errs;
}

export function passwordStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const map = ["Lemah", "Cukup", "Kuat", "Sangat kuat"] as const;
  return { level: score as 0 | 1 | 2 | 3, label: pw ? map[score] : "" };
}
