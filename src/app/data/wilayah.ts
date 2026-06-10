export const wilayahKalimantan: { provinsi: string; kabupaten: string[] }[] = [
  {
    provinsi: "Kalimantan Selatan",
    kabupaten: ["Kab. Banjar", "Kab. Tapin", "Kab. Hulu Sungai Selatan", "Kab. Hulu Sungai Tengah", "Kab. Hulu Sungai Utara", "Kab. Tabalong", "Kab. Barito Kuala", "Kab. Tanah Laut", "Kota Banjarmasin"],
  },
  {
    provinsi: "Kalimantan Tengah",
    kabupaten: ["Kab. Kapuas", "Kab. Pulang Pisau", "Kab. Barito Selatan", "Kab. Kotawaringin Timur", "Kab. Kotawaringin Barat", "Kota Palangka Raya"],
  },
  {
    provinsi: "Kalimantan Barat",
    kabupaten: ["Kab. Sambas", "Kab. Sanggau", "Kab. Sintang", "Kab. Ketapang", "Kab. Kubu Raya", "Kota Pontianak"],
  },
  {
    provinsi: "Kalimantan Timur",
    kabupaten: ["Kab. Kutai Kartanegara", "Kab. Paser", "Kab. Berau", "Kab. Penajam Paser Utara", "Kota Samarinda", "Kota Balikpapan"],
  },
  {
    provinsi: "Kalimantan Utara",
    kabupaten: ["Kab. Bulungan", "Kab. Malinau", "Kab. Nunukan", "Kota Tarakan"],
  },
];

export const wilayahFlat = wilayahKalimantan.flatMap((p) => p.kabupaten);
