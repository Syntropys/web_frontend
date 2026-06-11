import { memo } from "react";
import { Reveal } from "./reveal";

const KalimantanMap = memo(function KalimantanMap() {
  const regions = [
    { x: 180, y: 130, p: "high" },
    { x: 240, y: 170, p: "high" },
    { x: 310, y: 145, p: "med" },
    { x: 380, y: 175, p: "high" },
    { x: 420, y: 230, p: "med" },
    { x: 350, y: 250, p: "high" },
    { x: 270, y: 240, p: "med" },
    { x: 200, y: 220, p: "low" },
    { x: 150, y: 260, p: "med" },
    { x: 220, y: 300, p: "high" },
    { x: 305, y: 320, p: "med" },
    { x: 370, y: 305, p: "low" },
    { x: 285, y: 200, p: "low" },
  ];

  const dotClass = (p: string) =>
    p === "high"
      ? "fill-[#C9A24B]"
      : p === "med"
        ? "fill-[#7E8E78]"
        : "fill-[#5A6A60] dark:fill-[#8FA095]";

  return (
    <svg viewBox="0 0 600 420" className="w-full h-auto">
      <defs>
        <pattern
          id="petagrid"
          width="30"
          height="30"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 30 0 L 0 0 0 30"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.05"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>

      <rect
        width="600"
        height="420"
        fill="url(#petagrid)"
        className="text-[#2A3530] dark:text-[#E8E6DF]"
      />

      <path
        d="M 145 110 Q 180 80 230 90 Q 280 95 330 80 Q 380 75 420 110
           Q 460 145 470 195 Q 480 245 460 290 Q 440 335 395 355
           Q 345 375 290 365 Q 235 360 185 340 Q 140 320 120 275
           Q 105 230 115 180 Q 125 140 145 110 Z"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="1"
        className="text-[#2A3530] dark:text-[#E8E6DF]"
      />

      {regions.map((r, i) => (
        <circle key={i} cx={r.x} cy={r.y} r="4" className={dotClass(r.p)} />
      ))}

      <g
        className="text-[#5F6A64] dark:text-[#A8AFA9]"
        fill="currentColor"
        fontSize="9"
        fontFamily="monospace"
        letterSpacing="2"
      >
        <text x="18" y="28">
          N
        </text>
        <line
          x1="20"
          y1="35"
          x2="20"
          y2="58"
          stroke="currentColor"
          strokeWidth="0.8"
        />
        <text x="18" y="402">
          S
        </text>
      </g>

      <g
        className="text-[#5F6A64] dark:text-[#A8AFA9]"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
      >
        <line x1="500" y1="395" x2="580" y2="395" />
        <line x1="500" y1="392" x2="500" y2="398" />
        <line x1="540" y1="392" x2="540" y2="398" />
        <line x1="580" y1="392" x2="580" y2="398" />
      </g>
      <text
        x="500"
        y="385"
        className="text-[#5F6A64] dark:text-[#A8AFA9]"
        fill="currentColor"
        fontSize="8"
        fontFamily="monospace"
        letterSpacing="1"
      >
        0 — 200 KM
      </text>
    </svg>
  );
});

function RegionRow({
  name,
  prov,
  value,
  level,
}: {
  name: string;
  prov: string;
  value: string;
  level: "high" | "med" | "low";
}) {
  const dotClass =
    level === "high"
      ? "bg-[#C9A24B]"
      : level === "med"
        ? "bg-[#7E8E78]"
        : "bg-[#5A6A60] dark:bg-[#8FA095]";
  return (
    <div className="group flex items-center justify-between py-3 px-2 -mx-2 rounded-md border-b border-[#2A3530]/15 dark:border-[#E8E6DF]/12 last:border-b-0 cursor-pointer transition-colors hover:bg-[#2A3530]/4 dark:hover:bg-[#E8E6DF]/4">
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 transition-transform group-hover:scale-150 ${dotClass}`}
        />
        <div className="min-w-0">
          <div className="font-serif text-[15px] text-[#2A3530] dark:text-[#E8E6DF] truncate transition-colors group-hover:text-[#8C6E26] dark:group-hover:text-[#C9A24B]">
            {name}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#5F6A64] dark:text-[#A8AFA9] truncate">
            {prov}
          </div>
        </div>
      </div>
      <div className="font-mono text-[12px] text-[#4A5550] dark:text-[#B8BFB9] shrink-0 ml-3 transition-colors group-hover:text-[#8C6E26] dark:group-hover:text-[#C9A24B]">
        {value}
      </div>
    </div>
  );
}

export function Peta() {
  return (
    <section
      id="peta"
      className="relative px-5 sm:px-8 lg:px-14 py-20 sm:py-28 border-t border-[#2A3530]/15 dark:border-[#E8E6DF]/12"
    >
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 mb-12 sm:mb-16">
        <div className="lg:col-span-5">
          <div className="flex items-center gap-3 mb-8 sm:mb-12">
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#8C6E26] dark:text-[#C9A24B]">
              03
            </span>
            <span className="h-px w-10 bg-[#C9A24B]/40" />
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#5F6A64] dark:text-[#A8AFA9]">
              Peta · Pratinjau
            </span>
          </div>
          <Reveal>
            <h2 className="font-serif text-[32px] sm:text-[40px] lg:text-[52px] leading-[1.05] tracking-[-0.02em] text-[#2A3530] dark:text-[#E8E6DF]">
              Lanskap prioritas{" "}
              <em className="italic text-[#8C6E26] dark:text-[#C9A24B]">
                Kalimantan
              </em>
              , dalam satu pandangan.
            </h2>
          </Reveal>
        </div>
        <div className="lg:col-span-5 lg:col-start-8 flex items-end">
          <p className="text-[14px] sm:text-[15px] leading-[1.7] text-[#4A5550] dark:text-[#B8BFB9]">
            Cuplikan ringkas distribusi 56 kabupaten berdasarkan indeks
            produktivitas dan tingkat risiko di lima provinsi Kalimantan.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-px bg-[#2A3530]/12 dark:bg-[#E8E6DF]/12 rounded-2xl overflow-hidden">
        <div className="lg:col-span-7 relative bg-[#F7F3EA] dark:bg-[#0F181B] p-5 sm:p-7 lg:p-9">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A24B]" />
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#5F6A64] dark:text-[#A8AFA9]">
                Live Preview
              </span>
            </div>
            <span className="font-mono text-[10px] tracking-wider uppercase text-[#5F6A64] dark:text-[#A8AFA9]">
              56 Titik · 5 Provinsi
            </span>
          </div>

          <div className="relative">
            <KalimantanMap />
          </div>
        </div>

        <aside className="lg:col-span-5 bg-[#F7F3EA] dark:bg-[#0F181B] p-6 sm:p-7 lg:p-9 flex flex-col gap-7">
          <div>
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#5F6A64] dark:text-[#A8AFA9] mb-4">
              Distribusi Prioritas
            </div>
            <div className="flex items-baseline gap-6">
              {[
                { dot: "bg-[#C9A24B]", l: "Tinggi", n: "18" },
                { dot: "bg-[#7E8E78]", l: "Sedang", n: "24" },
                { dot: "bg-[#5A6A60] dark:bg-[#8FA095]", l: "Rendah", n: "14" },
              ].map((i) => (
                <div key={i.l} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${i.dot}`} />
                    <span className="text-[11px] text-[#5F6A64] dark:text-[#A8AFA9]">
                      {i.l}
                    </span>
                  </div>
                  <span className="font-serif text-[28px] sm:text-[32px] leading-none text-[#2A3530] dark:text-[#E8E6DF]">
                    {i.n}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-[#2A3530]/12 dark:bg-[#E8E6DF]/12" />

          <div>
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#5F6A64] dark:text-[#A8AFA9] mb-2">
              Sorotan Wilayah
            </div>
            <RegionRow
              name="Kutai Kartanegara"
              prov="Kaltim"
              value="5.8 t/ha"
              level="high"
            />
            <RegionRow
              name="Kotawaringin Timur"
              prov="Kalteng"
              value="5.4 t/ha"
              level="high"
            />
            <RegionRow
              name="Sintang"
              prov="Kalbar"
              value="4.6 t/ha"
              level="med"
            />
            <RegionRow
              name="Tanah Bumbu"
              prov="Kalsel"
              value="3.2 t/ha"
              level="low"
            />
          </div>
        </aside>
      </div>
    </section>
  );
}
