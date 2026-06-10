const memory = new Map<string, string>();
let warned = false;

function warnOnce(err: unknown) {
  if (warned) return;
  warned = true;
  console.warn(
    "[safe-storage] localStorage tidak tersedia, fallback ke memory (data hilang saat tab ditutup):",
    err,
  );
}

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

export const safeStorage = {
  getItem(key: string): string | null {
    if (!hasWindow()) return null;
    try {
      const v = window.localStorage.getItem(key);
      return v !== null ? v : memory.get(key) ?? null;
    } catch (err) {
      warnOnce(err);
      return memory.get(key) ?? null;
    }
  },

  setItem(key: string, value: string): void {
    if (!hasWindow()) return;
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      warnOnce(err);
      memory.set(key, value);
    }
  },

  removeItem(key: string): void {
    if (!hasWindow()) return;
    memory.delete(key);
    try {
      window.localStorage.removeItem(key);
    } catch (err) {
      warnOnce(err);
    }
  },
};
