import { useEffect, useState } from "react";
import { safeStorage } from "../lib/safe-storage";

export type Role = "admin" | "user";

const KEY = "agrolytics-role";

export function useRole() {
  const [role, setRoleState] = useState<Role>(() => {
    return (safeStorage.getItem(KEY) as Role) || "user";
  });

  useEffect(() => {
    const onChange = () => setRoleState((safeStorage.getItem(KEY) as Role) || "user");
    window.addEventListener("agrolytics-role-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("agrolytics-role-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const setRole = (r: Role) => {
    safeStorage.setItem(KEY, r);
    setRoleState(r);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("agrolytics-role-change"));
    }
  };

  return { role, setRole, isAdmin: role === "admin" };
}

export function setStoredRole(r: Role) {
  safeStorage.setItem(KEY, r);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("agrolytics-role-change"));
  }
}

export function clearSession() {
  safeStorage.removeItem(KEY);
  safeStorage.removeItem("agrolytics-profile");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("agrolytics-role-change"));
    window.dispatchEvent(new Event("agrolytics-profile-change"));
  }
}
