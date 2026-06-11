import { Reveal } from "./reveal";

export function Problem() {
  const metrics = [
    {
      value: "8",
      unit: "Tahun",
      label: "Data Historis BPS",
      detail:
        "Time-series produksi padi 2018–2025 yang diolah, dibersihkan, dan dinormalisasi pada level kabupaten.",
      n: "01",
    },
    {
      value: "56",
      unit: "Kab/Kota",
      label: "Wilayah Terpetakan",
      detail:
        "Cakupan lima provinsi Kalimantan, lengkap dengan stratifikasi agro-ekologi dan tipologi lahan.",
      n: "02",
    },
    {
      value: "1",
      unit: "Platform",
      label: "Sumber Kebenaran",
      detail:
        "Pengganti tumpukan spreadsheet dan laporan PDF — satu antarmuka untuk seluruh siklus keputusan.",
      n: "03",
    },
  ];

  return (
    <section
      id="masalah"
      className="relative px-5 sm:px-8 lg:px-14 py-20 sm:py-28 border-t border-[#2A3530]/15 dark:border-[#E8E6DF]/12"
    >
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 mb-12 sm:mb-20">
        <div className="lg:col-span-5">
          <div className="flex items-center gap-3 mb-8 sm:mb-12">
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#8C6E26] dark:text-[#C9A24B]">
              02
            </span>
            <span className="h-px w-10 bg-[#C9A24B]/40" />
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#5F6A64] dark:text-[#A8AFA9]">
              Latar Belakang
            </span>
          </div>
          <Reveal>
            <h2 className="font-serif text-[32px] sm:text-[40px] lg:text-[58px] leading-[1.05] lg:leading-[1.03] tracking-[-0.02em] text-[#2A3530] dark:text-[#E8E6DF]">
              Mengubah ketidakpastian menjadi{" "}
              <em className="italic text-[#8C6E26] dark:text-[#C9A24B]">
                keputusan strategis
              </em>
              .
            </h2>
          </Reveal>
        </div>
        <div className="lg:col-span-5 lg:col-start-8 flex items-end">
          <p className="text-[14px] sm:text-[15px] leading-[1.7] text-[#4A5550] dark:text-[#B8BFB9]">
            Volatilitas iklim, fragmentasi data, dan keterbatasan kapasitas
            penyuluh menempatkan keamanan pangan regional dalam risiko.
            Agrolytics mengkonsolidasi sinyal yang tersebar menjadi sebuah
            sistem pengamatan yang dapat ditindaklanjuti.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
        {metrics.map((m, idx) => (
          <Reveal key={m.n} delay={idx * 120} className="h-full">
            <div className="group relative h-full flex flex-col rounded-2xl border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-gradient-to-b from-[#F7F3EA] to-[#EFEBE1] dark:from-[#0F181B] dark:to-[#0B1215] p-6 sm:p-8 lg:p-10 overflow-hidden transition-colors duration-300 hover:border-[#C9A24B]/60">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A24B] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex justify-between items-start mb-8 sm:mb-12">
                <span className="font-mono text-[10px] tracking-[0.2em] text-[#5F6A64] dark:text-[#A8AFA9]">
                  {m.n} / 03
                </span>
                <span className="w-2 h-2 rounded-full bg-[#C9A24B] transition-transform duration-300 group-hover:scale-150" />
              </div>

              <div className="flex items-baseline gap-3 mb-3 flex-wrap">
                <span className="font-serif text-[72px] sm:text-[88px] lg:text-[104px] leading-[0.9] tracking-[-0.04em] text-[#2A3530] dark:text-[#E8E6DF]">
                  {m.value}
                </span>
                <span className="font-serif italic text-[18px] sm:text-[20px] text-[#8C6E26] dark:text-[#C9A24B]">
                  {m.unit}
                </span>
              </div>

              <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#8C6E26] dark:text-[#C9A24B] mb-3 sm:mb-4">
                {m.label}
              </div>
              <p className="text-[13px] leading-[1.7] text-[#5F6A64] dark:text-[#A8AFA9] max-w-xs">
                {m.detail}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
