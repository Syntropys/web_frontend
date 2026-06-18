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

    const systemPrompt = `Anda adalah asisten cerdas Decision Support AI untuk platform Agrolytics.
Tugas Anda membantu pengguna menganalisis perbandingan produksi, data historis BPS, curah hujan NASA POWER, dan prediksi model XGBoost, Random Forest, dan Linear Regression untuk padi di Kalimantan.
Informasi Tambahan: total wilayah terdata ${regionsCount} kabupaten. Estimasi rata-rata produktivitas 2026 adalah ${avgYield2026} t/ha.
Model terbaik adalah XGBoost dengan R²=0.986. Data historis dari BPS 2018-2025. Data cuaca dari NASA POWER.
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
