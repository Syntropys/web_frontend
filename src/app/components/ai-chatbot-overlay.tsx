import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Sparkles,
  X,
  Trash2,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const SUGGESTED = [
  "Wilayah mana produksi terendah 2026?",
  "Bandingkan XGBoost vs Random Forest",
  "Kabupaten risiko tinggi di Kalimantan Barat?",
  "Prediksi curah hujan vs hasil panen",
  "Rekomendasi intervensi pertanian prioritas?",
];

// Rotating bubble tips — relevan untuk Agrolytics
const BUBBLE_TIPS = [
  "Wilayah mana produksi terendah 2026?",
  "Tanya analisis iklim Kalimantan",
  "Cek prediksi panen XGBoost!",
  "Kabupaten risiko tinggi mana?",
  "Bandingkan model prediksi kita",
];

const GREETING: Message = {
  id: "greeting",
  role: "assistant",
  content:
    "Halo! Saya Decision Support AI Agrolytics. Saya siap membantu menganalisis data produksi padi, iklim, dan proyeksi wilayah Kalimantan 2026. Apa yang ingin Anda tanyakan?",
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[#C9A24B]"
          style={{
            animation: `chatBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function BubbleMessage({
  message,
  isNew,
}: {
  message: Message;
  isNew: boolean;
}) {
  const isUser = message.role === "user";
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} ${
        isNew ? "chat-bubble-in" : ""
      }`}
    >
      {!isUser && (
        <span className="w-6 h-6 rounded-full bg-[#C9A24B]/15 flex items-center justify-center shrink-0 mt-0.5 mr-1.5">
          <Sparkles size={10} className="text-[#C9A24B]" />
        </span>
      )}
      <div
        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-[1.6] ${
          isUser
            ? "bg-[#C9A24B] text-[#2A1F08] rounded-tr-sm font-medium shadow-sm"
            : "bg-white/60 dark:bg-white/[0.06] text-[#2A3530] dark:text-[#E8E6DF] border border-[#2A3530]/10 dark:border-[#E8E6DF]/8 rounded-tl-sm shadow-sm"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

export function AiChatbotOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [loading, setLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  // Rotating bubble tip
  const [tipIndex, setTipIndex] = useState(0);
  const [tipVisible, setTipVisible] = useState(true);
  const [tipDismissed, setTipDismissed] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasUserMessages = messages.some((m) => m.role === "user");

  // Get current user for conversation isolation
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? null);
    });
  }, []);

  // Load per-user conversation from sessionStorage
  useEffect(() => {
    if (!userId) return;
    const key = `agrolytics_chat_${userId}`;
    try {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        if (parsed.length > 0) setMessages(parsed);
      }
    } catch {
      // ignore
    }
  }, [userId]);

  // Persist per-user conversation
  useEffect(() => {
    if (!userId) return;
    const key = `agrolytics_chat_${userId}`;
    try {
      sessionStorage.setItem(key, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages, userId]);

  // Auto scroll to bottom
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setTipDismissed(true);
    }
  }, [isOpen]);

  // Rotate bubble tips every 3.5s — fade out → swap → fade in
  useEffect(() => {
    if (isOpen || tipDismissed) return;
    const interval = setInterval(() => {
      setTipVisible(false);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % BUBBLE_TIPS.length);
        setTipVisible(true);
      }, 350);
    }, 3500);
    return () => clearInterval(interval);
  }, [isOpen, tipDismissed]);

  // Auto-dismiss bubble after 20s
  useEffect(() => {
    const t = setTimeout(() => setTipDismissed(true), 20000);
    return () => clearTimeout(t);
  }, []);

  const handleSend = useCallback(
    async (userText: string) => {
      if (!userText.trim() || loading) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: userText.trim(),
      };

      setInput("");
      setMessages((prev) => [...prev, userMsg]);
      setNewMessageIds((s) => new Set(s).add(userMsg.id));
      setLoading(true);

      try {
        const [regionsRes, predictionsRes] = await Promise.all([
          supabase.from("regions").select("name, province"),
          supabase
            .from("predictions")
            .select("predicted_yield, predicted_prod_ton, target_year")
            .eq("model_name", "xgboost")
            .eq("model_version", "v1-real"),
        ]);

        const regionsCount = regionsRes.data?.length || 56;
        const predictions = (predictionsRes.data || []) as Array<{
          predicted_yield: number | null;
          predicted_prod_ton: number | null;
          target_year: number;
        }>;
        const totalYield = predictions.reduce(
          (acc, p) => acc + (p.predicted_yield || 0),
          0
        );
        const avgYield2026 =
          regionsCount > 0 ? (totalYield / regionsCount).toFixed(2) : "3.52";

        const history = messages
          .filter((m) => m.id !== "greeting")
          .map((m) => ({ role: m.role, content: m.content }));

        let aiResponseText = "";
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [...history, { role: "user", content: userText.trim() }],
              context: { regionsCount, avgYield2026 },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            aiResponseText = data.text || "";
          } else {
            throw new Error(`API ${res.status}`);
          }
        } catch {
          // Dev fallback — Gemini 2.5 Flash direct call
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const devKey: string = (import.meta as any).env?.VITE_GEMINI_API_KEY ?? "";
          if (!devKey) {
            aiResponseText =
              "Mode development: tambahkan VITE_GEMINI_API_KEY di .env untuk test lokal.";
          } else {
            const systemPrompt = `Anda adalah Decision Support AI Agrolytics. Bantu analisis data produksi padi Kalimantan. Total wilayah: ${regionsCount} kabupaten. Rata-rata yield 2026: ${avgYield2026} t/ha. Jawab dalam Bahasa Indonesia, ringkas dan bernilai tinggi.`;
            const gemRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${devKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [
                    { role: "user", parts: [{ text: systemPrompt }] },
                    { role: "model", parts: [{ text: "Siap!" }] },
                    ...history.map((m) => ({
                      role: m.role === "user" ? "user" : "model",
                      parts: [{ text: m.content }],
                    })),
                    { role: "user", parts: [{ text: userText.trim() }] },
                  ],
                }),
              }
            );
            const gd = await gemRes.json();
            aiResponseText =
              gd?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          }
        }

        const aiMsg: Message = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content:
            aiResponseText ||
            "Maaf, saya tidak dapat merespon saat ini. Silakan coba lagi.",
        };

        setMessages((prev) => [...prev, aiMsg]);
        setNewMessageIds((s) => new Set(s).add(aiMsg.id));
      } catch (err) {
        console.error(err);
        const errMsg: Message = {
          id: `e-${Date.now()}`,
          role: "assistant",
          content:
            "Maaf, terjadi masalah koneksi. Pastikan Anda terhubung ke internet dan coba lagi.",
        };
        setMessages((prev) => [...prev, errMsg]);
        setNewMessageIds((s) => new Set(s).add(errMsg.id));
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [loading, messages]
  );

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const handleClear = () => {
    setMessages([GREETING]);
    setShowClearConfirm(false);
    setNewMessageIds(new Set());
    if (userId) {
      sessionStorage.removeItem(`agrolytics_chat_${userId}`);
    }
  };

  return (
    <>
      <style>{`
        @keyframes chatBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes chatBubbleIn {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .chat-bubble-in {
          animation: chatBubbleIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }

        /* FAB gentle bounce — persis referensi ledgerly */
        @keyframes fab-bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
        .fab-bounce-btn {
          animation: fab-bounce 2s ease-in-out infinite;
        }
        .fab-bounce-btn:hover {
          animation-play-state: paused;
          transform: scale(1.1) translateY(-3px) !important;
        }

        /* Bubble tip fade */
        @keyframes tip-fade-in {
          from { opacity: 0; transform: translateX(10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .tip-visible {
          opacity: 1;
          transform: translateX(0);
          transition: opacity 0.35s ease, transform 0.35s ease;
        }
        .tip-hidden {
          opacity: 0;
          transform: translateX(8px);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .tip-enter {
          animation: tip-fade-in 0.5s ease-out;
        }

        /* Chat window open */
        @keyframes chatWindowIn {
          from { opacity: 0; transform: scale(0.93) translateY(10px); transform-origin: bottom right; }
          to   { opacity: 1; transform: scale(1) translateY(0); transform-origin: bottom right; }
        }
        .chat-window-in {
          animation: chatWindowIn 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
      `}</style>

      {/* ─── FAB ─── */}
      {!isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3"
          style={{ pointerEvents: "none" }}
        >
          {/* Bubble tip — di kiri FAB, persis referensi ledgerly */}
          {!tipDismissed && (
            <div
              className={tipVisible ? "tip-visible" : "tip-hidden"}
              style={{ pointerEvents: "auto" }}
            >
              <div className="relative bg-white dark:bg-[#1C2B30] text-[#2A3530] dark:text-[#E8E6DF] text-[13px] font-medium rounded-xl px-4 py-2 shadow-lg border border-[#2A3530]/8 dark:border-[#E8E6DF]/10 whitespace-nowrap">
                {BUBBLE_TIPS[tipIndex]}
                {/* Arrow tail pointing right toward FAB */}
                <span
                  className="absolute top-1/2 -right-[7px] w-[10px] h-[10px] bg-white dark:bg-[#1C2B30] border-r border-t border-[#2A3530]/8 dark:border-[#E8E6DF]/10"
                  style={{ transform: "translateY(-50%) rotate(45deg)" }}
                />
              </div>
            </div>
          )}

          {/* FAB ball — 56px round, gentle bounce */}
          <button
            id="chatbot-fab-btn"
            onClick={() => setIsOpen(true)}
            aria-label="Buka asisten AI"
            style={{ pointerEvents: "auto" }}
            className="fab-bounce-btn relative grid place-items-center w-14 h-14 rounded-full bg-gradient-to-br from-[#D4B05E] to-[#C9A24B] text-[#2A1F08] border-none cursor-pointer shadow-[0_4px_20px_rgba(201,162,75,0.45)] transition-all duration-300"
          >
            <Sparkles className="w-6 h-6" strokeWidth={1.8} />
            {/* Green online dot */}
            <span className="absolute top-[3px] right-[3px] w-3 h-3 rounded-full bg-[#7A9A6E] border-2 border-white dark:border-[#0B1215]" />
          </button>
        </div>
      )}

      {/* ─── Chat Window ─── */}
      {isOpen && (
        <div
          id="chatbot-window"
          className="chat-window-in fixed bottom-6 right-6 z-50 w-[360px] sm:w-[420px] flex flex-col rounded-3xl border border-[#2A3530]/12 dark:border-[#E8E6DF]/10 bg-[#F7F4EE]/96 dark:bg-[#0E1619]/96 backdrop-blur-2xl shadow-2xl shadow-black/20 overflow-hidden"
          style={{ maxHeight: "min(600px, calc(100vh - 100px))" }}
        >
          {/* Header */}
          <header className="shrink-0 flex items-center justify-between px-4 py-3.5 bg-white/30 dark:bg-white/[0.03] border-b border-[#2A3530]/8 dark:border-[#E8E6DF]/8">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-2xl bg-[#C9A24B]/15 dark:bg-[#C9A24B]/12 flex items-center justify-center shrink-0">
                <Sparkles size={16} className="text-[#C9A24B]" />
              </span>
              <div>
                <p className="font-serif text-[14px] font-semibold text-[#2A3530] dark:text-[#E8E6DF] leading-tight">
                  Decision Support AI
                </p>
                <p className="text-[10px] text-[#7A9A6E] font-medium tracking-wide flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7A9A6E] animate-pulse" />
                  Aktif · Gemini 2.5 Flash
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {!showClearConfirm ? (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  title="Hapus riwayat chat"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#5F6A64] dark:text-[#A8AFA9] hover:bg-[#A04848]/10 hover:text-[#A04848] dark:hover:text-[#D17878] transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-[#A04848]/8 dark:bg-[#A04848]/12 rounded-full px-2 py-1">
                  <span className="text-[11px] text-[#A04848] dark:text-[#D17878] font-medium">
                    Hapus?
                  </span>
                  <button
                    onClick={handleClear}
                    className="text-[11px] text-[#A04848] dark:text-[#D17878] font-semibold hover:underline cursor-pointer"
                  >
                    Ya
                  </button>
                  <span className="text-[#A04848]/40">·</span>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="text-[11px] text-[#5F6A64] dark:text-[#A8AFA9] hover:underline cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              )}
              <button
                onClick={() => setIsOpen(false)}
                title="Tutup"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#5F6A64] dark:text-[#A8AFA9] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#2A3530] dark:hover:text-[#E8E6DF] transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </header>

          {/* Messages */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(140,110,38,0.2) transparent",
            }}
          >
            {messages.map((m) => (
              <BubbleMessage
                key={m.id}
                message={m}
                isNew={newMessageIds.has(m.id)}
              />
            ))}

            {loading && (
              <div className="flex justify-start chat-bubble-in">
                <span className="w-6 h-6 rounded-full bg-[#C9A24B]/15 flex items-center justify-center shrink-0 mt-0.5 mr-1.5">
                  <Sparkles size={10} className="text-[#C9A24B]" />
                </span>
                <div className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 bg-white/60 dark:bg-white/[0.06] border border-[#2A3530]/10 dark:border-[#E8E6DF]/8 shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}
          </div>

          {/* Suggested chips */}
          {!hasUserMessages && !loading && (
            <div className="shrink-0 px-4 pb-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#5F6A64] dark:text-[#A8AFA9] mb-2">
                Coba tanyakan
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#2A3530]/6 dark:bg-[#E8E6DF]/6 hover:bg-[#C9A24B]/12 dark:hover:bg-[#C9A24B]/12 hover:text-[#8C6E26] dark:hover:text-[#C9A24B] text-[11px] text-[#5F6A64] dark:text-[#A8AFA9] border border-[#2A3530]/8 dark:border-[#E8E6DF]/8 hover:border-[#C9A24B]/30 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <ChevronRight size={10} />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="shrink-0 h-px bg-[#2A3530]/8 dark:bg-[#E8E6DF]/8" />

          {/* Input */}
          <form
            onSubmit={handleFormSubmit}
            className="shrink-0 flex items-center gap-2 px-3 py-3 bg-white/20 dark:bg-white/[0.02]"
          >
            <input
              ref={inputRef}
              id="chatbot-input"
              type="text"
              placeholder="Tulis pertanyaan Anda..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              autoComplete="off"
              className="flex-1 min-w-0 bg-[#F7F3EA] dark:bg-[#121E22] rounded-2xl border border-[#2A3530]/10 dark:border-[#E8E6DF]/10 focus:border-[#C9A24B] dark:focus:border-[#C9A24B] px-3.5 py-2.5 text-[13px] text-[#2A3530] dark:text-[#E8E6DF] placeholder-[#5F6A64]/40 dark:placeholder-[#A8AFA9]/40 focus:outline-none transition-colors disabled:opacity-50"
            />
            <button
              id="chatbot-send-btn"
              type="submit"
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-2xl bg-[#C9A24B] text-[#2A1F08] hover:bg-[#D4B05E] disabled:opacity-40 flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
