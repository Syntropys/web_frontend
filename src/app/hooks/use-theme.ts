import { useEffect, useState } from "react";
import { safeStorage } from "../lib/safe-storage";

export type Theme = "dark" | "light";

const STORAGE_KEY = "agrolytics-theme";

function getInitial(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = safeStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === "dark" || stored === "light") return stored;
  return "dark";
}

if (typeof document !== "undefined") {
  document.documentElement.classList.toggle("dark", getInitial() === "dark");
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitial);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    safeStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return {
    theme,
    toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
  };
}
