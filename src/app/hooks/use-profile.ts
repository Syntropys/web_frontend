import { useEffect, useState } from "react";
import { safeStorage } from "../lib/safe-storage";

export type Profile = {
  nama: string;
  email: string;
  wilayah?: string;
};

export type Account = Profile & { passwordHash: string };

const PROFILE_KEY = "agrolytics-profile";
const ACCOUNTS_KEY = "agrolytics-accounts";
const SALT = "agrolytics-2026-demo";

const empty: Profile = { nama: "", email: "" };

export async function hashPassword(pw: string): Promise<string> {
  const data = new TextEncoder().encode(pw + SALT);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function saveProfile(p: Profile) {
  safeStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("agrolytics-profile-change"));
  }
}

export function readProfile(): Profile {
  try {
    const raw = safeStorage.getItem(PROFILE_KEY);
    if (!raw) return empty;
    return JSON.parse(raw) || empty;
  } catch {
    return empty;
  }
}

export function readAccounts(): Account[] {
  try {
    const raw = safeStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function upsertAccount(acc: Account) {
  const all = readAccounts();
  const idx = all.findIndex((a) => a.email.toLowerCase() === acc.email.toLowerCase());
  if (idx >= 0) all[idx] = acc;
  else all.push(acc);
  safeStorage.setItem(ACCOUNTS_KEY, JSON.stringify(all));
}

export function findAccount(email: string): Account | null {
  const target = email.trim().toLowerCase();
  return readAccounts().find((a) => a.email.toLowerCase() === target) ?? null;
}

export function getInitials(nama: string): string {
  const cleaned = nama.trim();
  if (!cleaned) return "AG";
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(() => readProfile());

  useEffect(() => {
    const onChange = () => setProfile(readProfile());
    window.addEventListener("agrolytics-profile-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("agrolytics-profile-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return { profile, initials: getInitials(profile.nama) };
}
