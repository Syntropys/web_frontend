import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "edge",
};

const GEMINI_MODEL = "gemini-2.5-flash";

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
    const { messages, context } = body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      context?: {
        regionsCount: number;
        avgYield2026: string;
        databaseSummary?: string;
      };
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const regionsCount = context?.regionsCount ?? 56;
    const avgYield2026 = context?.avgYield2026 ?? "3.52";
    const databaseSummary = context?.databaseSummary ?? "";

    const systemPrompt = `Anda adalah asisten cerdas Decision Support AI untuk platform Agrolytics.
Fungsi utama Anda adalah membantu pengguna menganalisis perbandingan produksi padi, data historis BPS (2018-2025), curah hujan NASA POWER, K-Means risk clustering, dan prediksi model XGBoost/Random Forest untuk Kalimantan.

ATURAN BATASAN RUANG LINGKUP (SANGAT KETAT):
1. Anda HANYA diizinkan menjawab pertanyaan yang berkaitan dengan sistem Agrolytics, pertanian padi, cuaca/iklim Kalimantan, data produksi, dan model prediksi di platform ini.
2. TOLAK secara sopan namun tegas semua permintaan di luar topik pertanian/Agrolytics, seperti:
   - Pemrograman/koding umum (misal: "cara hello world di Python", menulis skrip koding umum).
   - Penugasan peran lain (misal: "anggap kamu seorang programmer/rekan koding/pacar/guru").
   - Pertanyaan umum (sains umum, matematika, sejarah, terjemahan bahasa umum, dll.).
3. Jika pengguna mencoba mengalihkan topik atau meminta Anda berperan sebagai karakter lain, berikan jawaban penolakan standar berikut secara profesional:
   "Maaf, sebagai asisten Decision Support AI Agrolytics, saya hanya diizinkan untuk membantu Anda dengan analisis data produksi padi, iklim, dan proyeksi pertanian di Kalimantan pada platform Agrolytics."

Informasi Tambahan: total wilayah terdata ${regionsCount} kabupaten. Estimasi rata-rata produktivitas 2026 adalah ${avgYield2026} t/ha.
Model terbaik adalah XGBoost dengan R²=0.986. Data cuaca dari NASA POWER.
${databaseSummary ? `\nBerikut adalah data ringkasan aktual dari database:\n${databaseSummary}\n` : ""}
Gunakan bahasa Indonesia yang ramah, sopan, bernada profesional, dan ringkas. Jangan terlalu panjang lebar, tapi berikan insight bernilai tinggi.
Format jawaban: gunakan paragraf singkat, bisa pakai list jika relevan. Maksimal 3-4 kalimat per poin.`;

    // Build contents array for Gemini API
    const contents = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [
          {
            text: "Siap! Saya akan membantu Anda menganalisis data pertanian Kalimantan dengan akurat dan ringkas.",
          },
        ],
      },
      ...messages.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
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
            temperature: 0.7,
            maxOutputTokens: 1024,
            topP: 0.9,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 502, headers: corsHeaders }
      );
    }

    const resData = await geminiRes.json();
    const text =
      resData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Maaf, saya tidak dapat merespon saat ini. Silakan coba lagi.";

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err: unknown) {
    console.error("Chat API error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
}
