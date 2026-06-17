import { useEffect, lazy, Suspense } from "react";
import { Nav } from "../components/nav";
import { Hero } from "../components/hero";
import { Pillars } from "../components/pillars";
import { Problem } from "../components/problem";
import { Footer } from "../components/footer";

const Peta = lazy(() => import("../components/peta").then((m) => ({ default: m.Peta })));

export default function Landing() {
  useEffect(() => {
    document.title = "Agrolytics";
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#EFEBE1] text-[#2A3530] dark:bg-[#0B1215] dark:text-[#E8E6DF] overflow-x-hidden transition-colors">
      <Nav />
      <Hero />
      <Problem />
      <Suspense fallback={
        <div className="mx-5 sm:mx-8 lg:mx-14 my-20 sm:my-28 h-[420px] bg-[#F7F3EA] dark:bg-[#0F181B] animate-pulse rounded-xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 flex items-center justify-center">
          <span className="font-mono text-[12px] tracking-wider text-[#5F6A64]/60 dark:text-[#A8AFA9]/60">Memuat Peta Spasial...</span>
        </div>
      }>
        <Peta />
      </Suspense>
      <Pillars />
      <Footer />
    </div>
  );
}
