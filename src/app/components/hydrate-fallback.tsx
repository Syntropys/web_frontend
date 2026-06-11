import { BrandMark } from "./brand-mark";

export function HydrateFallback() {
  return (
    <div className="min-h-screen w-full bg-[#EFEBE1] text-[#2A3530] dark:bg-[#0B1215] dark:text-[#E8E6DF] flex items-center justify-center transition-colors">
      <div className="flex items-center gap-3 opacity-80">
        <BrandMark size={22} className="text-[#C9A24B] animate-pulse" />
        <span className="font-serif text-[18px] tracking-tight">
          Agrolytics
        </span>
      </div>
    </div>
  );
}
