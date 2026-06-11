import { memo } from "react";
import { Reveal } from "./reveal";

function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-12">
      <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#8C6E26] dark:text-[#C9A24B]">
        {index}
      </span>
      <span className="h-px w-10 bg-[#C9A24B]/40" />
      <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#5F6A64] dark:text-[#A8AFA9]">
        {label}
      </span>
    </div>
  );
}

const PredictiveChart = memo(function PredictiveChart() {
  const points = [38, 42, 41, 47, 52, 49, 58, 64, 71];
  const max = 80;
  const w = 260;
  const h = 120;
  const step = w / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (p / max) * h}`)
    .join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h + 10}`}
      className="w-full h-auto text-[#2A3530] dark:text-[#E8E6DF]"
    >
      <defs>
        <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9A24B" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#C9A24B" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((y) => (
        <line
          key={y}
          x1="0"
          x2={w}
          y1={h * y}
          y2={h * y}
          stroke="currentColor"
          strokeOpacity="0.12"
        />
      ))}
      <path d={area} fill="url(#grad1)" />
      <path d={path} stroke="#C9A24B" strokeWidth="1.5" fill="none" />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={i * step}
          cy={h - (p / max) * h}
          r={i === points.length - 1 ? 3.5 : 1.5}
          fill="#C9A24B"
        />
      ))}
      <line
        x1={(points.length - 2) * step}
        x2={w}
        y1={h - (points[points.length - 2] / max) * h}
        y2={h - (points[points.length - 1] / max) * h}
        stroke="#C9A24B"
        strokeDasharray="3 3"
        strokeWidth="1"
      />
    </svg>
  );
});

const MapSnippet = memo(function MapSnippet() {
  const dots = [
    { x: 30, y: 40, p: "high" },
    { x: 60, y: 30, p: "high" },
    { x: 90, y: 55, p: "med" },
    { x: 130, y: 35, p: "low" },
    { x: 160, y: 70, p: "med" },
    { x: 200, y: 50, p: "high" },
    { x: 230, y: 80, p: "low" },
    { x: 75, y: 80, p: "med" },
    { x: 180, y: 95, p: "high" },
    { x: 120, y: 90, p: "low" },
    { x: 50, y: 105, p: "med" },
  ];
  const dotClass = (p: string) =>
    p === "high"
      ? "fill-[#C9A24B]"
      : p === "med"
        ? "fill-[#7E8E78]"
        : "fill-[#5A6A60] dark:fill-[#8FA095]";
  return (
    <svg
      viewBox="0 0 260 130"
      className="w-full h-auto text-[#2A3530] dark:text-[#E8E6DF]"
    >
      <path
        d="M10 60 Q 40 30 80 45 T 160 35 Q 200 30 250 55 L 250 110 Q 200 125 160 115 T 80 120 Q 40 125 10 110 Z"
        fill="currentColor"
        fillOpacity="0.06"
        stroke="currentColor"
        strokeOpacity="0.2"
      />
      {dots.map((d, i) => (
        <g key={i}>
          <circle
            cx={d.x}
            cy={d.y}
            r="8"
            className={dotClass(d.p)}
            fillOpacity="0.15"
          />
          <circle cx={d.x} cy={d.y} r="3" className={dotClass(d.p)} />
        </g>
      ))}
    </svg>
  );
});

const ScanSnippet = memo(function ScanSnippet() {
  return (
    <svg
      viewBox="0 0 260 130"
      className="w-full h-auto text-[#2A3530] dark:text-[#E8E6DF]"
    >
      <rect
        x="95"
        y="10"
        width="70"
        height="115"
        rx="9"
        stroke="currentColor"
        strokeOpacity="0.3"
        fill="currentColor"
        fillOpacity="0.06"
      />
      <rect
        x="100"
        y="18"
        width="60"
        height="92"
        rx="3"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path
        d="M130 30 C 118 50 122 75 130 100 C 138 75 142 50 130 30 Z"
        fill="#7E8E78"
      />
      <path
        d="M130 30 L 130 100"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="0.8"
      />
      <circle cx="138" cy="60" r="3" fill="#C9A24B" />
      <circle cx="124" cy="78" r="2" fill="#C9A24B" />
      <rect x="100" y="18" width="60" height="2" fill="#C9A24B" opacity="0.7" />
      <text
        x="130"
        y="120"
        fontSize="5"
        fill="currentColor"
        fillOpacity="0.55"
        textAnchor="middle"
        fontFamily="monospace"
      >
        CNN · scanning…
      </text>
      <line
        x1="20"
        y1="40"
        x2="80"
        y2="40"
        stroke="currentColor"
        strokeOpacity="0.2"
      />
      <text
        x="20"
        y="36"
        fontSize="6"
        fill="currentColor"
        fillOpacity="0.55"
        fontFamily="monospace"
      >
        DETEKSI
      </text>
      <text x="20" y="52" fontSize="8" fill="#C9A24B" fontFamily="serif">
        Blast (P. oryzae)
      </text>
      <text
        x="20"
        y="62"
        fontSize="6"
        fill="currentColor"
        fillOpacity="0.55"
        fontFamily="monospace"
      >
        CONF · 0.91
      </text>
      <line
        x1="180"
        y1="85"
        x2="240"
        y2="85"
        stroke="currentColor"
        strokeOpacity="0.2"
      />
      <text
        x="180"
        y="81"
        fontSize="6"
        fill="currentColor"
        fillOpacity="0.55"
        fontFamily="monospace"
      >
        REKOMENDASI
      </text>
      <text x="180" y="97" fontSize="7" fill="currentColor" fontFamily="serif">
        Fungisida triazol
      </text>
    </svg>
  );
});

export function Pillars() {
  const cards = [
    {
      n: "i.",
      tag: "Forecasting",
      title: "Predictive Analytics",
      copy: "Model ensemble XGBoost + LSTM memproyeksikan produktivitas panen 2026 hingga tingkat kabupaten.",
      visual: <PredictiveChart />,
      meta: "Proyeksi 2026 · ton/ha",
    },
    {
      n: "ii.",
      tag: "Spatial",
      title: "Geospatial Intelligence",
      copy: "Pemetaan klaster prioritas tinggi, sedang, dan rendah berbasis indeks vegetasi & data cuaca real-time.",
      visual: <MapSnippet />,
      meta: "Kalimantan · 56 titik aktif",
    },
    {
      n: "iii.",
      tag: "Vision",
      title: "Deteksi Penyakit Instan",
      copy: "Computer vision berbasis CNN mendiagnosis penyakit daun padi langsung dari kamera ponsel lapangan.",
      visual: <ScanSnippet />,
      meta: "On-device · ResNet-50",
    },
  ];

  return (
    <section
      id="solusi"
      className="relative px-5 sm:px-8 lg:px-14 py-20 sm:py-28 border-t border-[#2A3530]/15 dark:border-[#E8E6DF]/12"
    >
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 mb-12 sm:mb-16">
        <div className="lg:col-span-5">
          <SectionLabel index="04" label="Tiga Pilar" />
          <Reveal>
            <h2 className="font-serif text-[32px] sm:text-[40px] lg:text-[52px] leading-[1.05] tracking-[-0.02em] text-[#2A3530] dark:text-[#E8E6DF]">
              Satu platform, tiga{" "}
              <em className="italic text-[#8C6E26] dark:text-[#C9A24B]">
                disiplin
              </em>{" "}
              kecerdasan.
            </h2>
          </Reveal>
        </div>
        <div className="lg:col-span-5 lg:col-start-8 flex items-end">
          <p className="text-[14px] sm:text-[15px] leading-[1.7] text-[#4A5550] dark:text-[#B8BFB9]">
            Dirancang untuk pengambil keputusan yang membutuhkan keyakinan
            kuantitatif — bukan sekadar dashboard, melainkan instrumen presisi
            bagi dinas pertanian dan agribisnis modern.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-px bg-[#2A3530]/12 dark:bg-[#E8E6DF]/12 rounded-2xl overflow-hidden">
        {cards.map((c, idx) => (
          <Reveal key={c.title} delay={idx * 120}>
            <article className="group relative h-full bg-[#F7F3EA] dark:bg-[#0F181B] p-6 sm:p-8 lg:p-10 flex flex-col gap-6 sm:gap-8 transition-all hover:bg-[#FAF5E8] dark:hover:bg-[#152226] hover:shadow-lg hover:shadow-[#2A3530]/5 dark:hover:shadow-[#000000]/30 cursor-pointer">
              <div className="flex items-center justify-between">
                <span className="font-serif italic text-[20px] text-[#8C6E26] dark:text-[#C9A24B]">
                  {c.n}
                </span>
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#5F6A64] dark:text-[#A8AFA9]">
                  {c.tag}
                </span>
              </div>

              <div className="rounded-xl bg-[#EFEBE1]/70 dark:bg-[#0B1215]/60 border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 p-4 sm:p-5 backdrop-blur-sm">
                {c.visual}
                <div className="mt-3 pt-3 border-t border-[#2A3530]/15 dark:border-[#E8E6DF]/12 font-mono text-[10px] tracking-wider uppercase text-[#5F6A64] dark:text-[#A8AFA9]">
                  {c.meta}
                </div>
              </div>

              <div className="mt-auto">
                <h3 className="mb-3 font-serif text-[22px] sm:text-[26px] leading-tight tracking-tight text-[#2A3530] dark:text-[#E8E6DF] transition-colors group-hover:text-[#8C6E26] dark:group-hover:text-[#C9A24B]">
                  {c.title}
                </h3>
                <p className="text-[13px] sm:text-[14px] leading-[1.7] text-[#4A5550] dark:text-[#B8BFB9]">
                  {c.copy}
                </p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
