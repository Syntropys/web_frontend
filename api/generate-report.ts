export const config = {
  runtime: "edge",
};

const GEMINI_MODEL = "gemini-1.5-flash";

export default async function handler(req: Request) {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Server configuration error: API key missing" }),
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const body = await req.json();
    const {
      regionName,
      provinceName,
      predictedYield,
      predictedProd,
      priorityKey,
      recommendedAction,
      recommendedItems,
      letterNumber,
    } = body as {
      regionName: string;
      provinceName: string;
      predictedYield: number;
      predictedProd: number;
      priorityKey: string;
      recommendedAction: string;
      recommendedItems: string[];
      letterNumber?: string;
    };

    if (!regionName || !provinceName) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const dynamicLetterNumber = letterNumber || `521/${Math.floor(1000 + Math.random() * 9000)}/AGR-REKOM/VI/2026`;

    const systemPrompt = `Anda adalah staf ahli analisis kebijakan pertanian senior di platform Agrolytics.
Tugas Anda adalah menulis teks/paragraf analisis rekomendasi kebijakan pertanian resmi dalam bahasa Indonesia yang sangat formal, diplomatik, birokratis, dan persuasif.

ATURAN PENTING (SANGAT KETAT):
1. JANGAN gunakan format markdown seperti bintang double (**), bintang (*), pagar (#), atau list markdown (- atau *).
2. Tuliskan surat secara langsung dalam format paragraf teks biasa dengan spasi pemisah antar paragraf yang jelas.
3. Hindari penggunaan tag HTML atau pemformatan teks kaya lainnya.
4. Nada bicara harus sangat formal, sesuai dengan gaya korespondensi resmi instansi pemerintah/kementerian di Indonesia.
5. SANGAT PENTING: JANGAN menuliskan Kop Surat, nomor surat, sifat, lampiran, perihal, tanggal, alamat tujuan, salam pembuka (seperti 'Dengan hormat'), salam penutup (seperti 'Hormat Kami'), nama penandatangan, atau ruang tanda tangan. Mulailah langsung dengan paragraf pertama (pendahuluan analisis) dan akhiri langsung setelah paragraf penutup selesai.`;

    const userPrompt = `Tuliskan paragraf analisis rekomendasi kebijakan pertanian resmi untuk wilayah berikut:
- Kabupaten: ${regionName}
- Provinsi: ${provinceName}
- Estimasi Yield Padi 2026: ${predictedYield > 0 ? predictedYield.toFixed(2) : "—"} t/ha
- Estimasi Total Produksi Padi 2026: ${predictedProd > 0 ? Math.round(predictedProd).toLocaleString("id-ID") : "—"} ton
- Tingkat Risiko/Prioritas: Prioritas ${priorityKey.toUpperCase()} (Aksi Rekomendasi: ${recommendedAction})

Struktur Paragraf yang Harus Dihasilkan (Tepat 3 Paragraf):
1. Paragraf 1 (Pendahuluan):
   Sampaikan bahwa berdasarkan hasil analisis komputasi platform Decision Support System (DSS) Agrolytics mengenai proyeksi produksi padi tahun 2026 menggunakan model predictive analytics XGBoost (R²=0.986) dan klasterisasi risiko K-Means, dengan ini disampaikan rekomendasi strategis untuk Kabupaten ${regionName}.

2. Paragraf 2 (Pemaparan Data & Kondisi):
   Paparkan data hasil prediksi secara naratif. Sebutkan bahwa Kabupaten ${regionName} diprediksi memiliki produktivitas (yield) sebesar ${predictedYield.toFixed(2)} t/ha dengan total produksi komoditas padi mencapai ${Math.round(predictedProd).toLocaleString("id-ID")} ton. Jelaskan implikasi dari pengelompokan daerah ini ke dalam kategori Prioritas ${priorityKey.toUpperCase()} dengan arahan aksi "${recommendedAction}".

3. Paragraf 3 (Penutup):
   Sampaikan kalimat penutup dinas formal, menyatakan harapan agar rekomendasi kebijakan ini dapat menjadi acuan penyusunan program kerja dinas pertanian setempat guna menjaga stabilitas suplai pangan regional Kalimantan.

PENTING: JANGAN sebutkan rincian rencana aksi rekomendasi seperti pembagian benih, penyuluhan, irigasi, atau subsidi pupuk di dalam teks Anda, karena poin-poin tersebut akan dimasukkan secara otomatis oleh sistem di bagian lain. Cukup hasilkan 3 paragraf di atas secara berurutan.`;

    const contents = [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
      },
    ];

    // Call Gemini API (server-side, API key never exposed to browser)
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.5, // lower temp for more structured, formal output
            maxOutputTokens: 1500,
            topP: 0.9,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error in generate-report:", errText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 502, headers: corsHeaders }
      );
    }

    const resData = await geminiRes.json();
    const text =
      resData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Maaf, draf laporan gagal dibuat. Silakan coba lagi.";

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err: unknown) {
    console.error("Generate-report API error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
}
