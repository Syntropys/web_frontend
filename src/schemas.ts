import { z } from 'zod'

const namaSchema = z
  .string()
  .trim()
  .min(3, 'Min. 3 karakter')
  .max(80, 'Terlalu panjang')
  .regex(/^[a-zA-Z\s.'-]+$/, 'Hanya huruf & spasi')

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Wajib diisi')
  .email('Format email salah')
  .max(120, 'Terlalu panjang')
  .transform(v => v.toLowerCase())

const passwordLoginSchema = z
  .string()
  .min(8, 'Min. 8 karakter')
  .max(128, 'Terlalu panjang')

const passwordStrongSchema = z
  .string()
  .min(8, 'Min. 8 karakter')
  .max(128, 'Terlalu panjang')
  .regex(/[A-Z]/, 'Butuh 1 huruf besar')
  .regex(/[a-z]/, 'Butuh 1 huruf kecil')
  .regex(/[0-9]/, 'Butuh 1 angka')

export const LoginSchema = z.object({
  email: emailSchema,
  password: passwordLoginSchema,
})

export const DaftarSchema = z.object({
  nama: namaSchema,
  email: emailSchema,
  password: passwordStrongSchema,
  konfirmasiPassword: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
  setuju: z.literal(true, { message: 'Anda harus menyetujui Syarat & Privasi' }),
}).refine((data) => data.password === data.konfirmasiPassword, {
  message: 'Kata sandi tidak cocok',
  path: ['konfirmasiPassword'],
})

export const AddUserSchema = z.object({
  nama: namaSchema,
  email: emailSchema,
  role: z.enum(['admin', 'user']),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type DaftarInput = z.infer<typeof DaftarSchema>
export type AddUserInput = z.infer<typeof AddUserSchema>

export function fieldErrors(
  result: { success: boolean; error?: { issues: Array<{ path: Array<unknown>; message: string }> } },
): Record<string, string> {
  if (result.success) return {} as Record<string, string>
  const errs: Record<string, string> = {}
  for (const issue of result.error!.issues) {
    const key = issue.path[0]?.toString() ?? '_'
    if (!errs[key]) errs[key] = issue.message
  }
  return errs
}

export function passwordStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++
  const map = ['Lemah', 'Cukup', 'Kuat', 'Sangat kuat'] as const
  return { level: score as 0 | 1 | 2 | 3, label: pw ? map[score] : '' }
}
