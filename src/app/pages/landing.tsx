import { useEffect } from "react";
import { Nav } from "../components/nav";
import { Hero } from "../components/hero";
import { Pillars } from "../components/pillars";
import { Problem } from "../components/problem";
import { Peta } from "../components/peta";
import { Footer } from "../components/footer";

export default function Landing() {
  useEffect(() => {
    document.title = "Agrolytics";
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#EFEBE1] text-[#2A3530] dark:bg-[#0B1215] dark:text-[#E8E6DF] overflow-x-hidden transition-colors">
      <Nav />
      <Hero />
      <Problem />
      <Peta />
      <Pillars />
      <Footer />
    </div>
  );
}
