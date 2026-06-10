import { Component, useEffect, type ErrorInfo, type ReactNode } from "react";
import { useRouteError } from "react-router";

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

function ErrorFallback() {
  useEffect(() => {
    const prev = document.title;
    document.title = "505";
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#EFEBE1] text-[#2A3530] dark:bg-[#0B1215] dark:text-[#E8E6DF] flex items-center justify-center px-5 sm:px-8 transition-colors">
      <div className="max-w-md w-full text-center">
        <p className="font-serif text-[88px] sm:text-[112px] leading-none tracking-tight text-[#A07F2E] dark:text-[#C9A24B]">
          505
        </p>

        <h1 className="mt-6 font-serif tracking-tight text-[#2A3530] dark:text-[#E8E6DF]">
          Terjadi kesalahan
        </h1>

        <p className="mt-3 text-[14px] leading-relaxed text-[#5F6A64] dark:text-[#B8BFB9]">
          Halaman tidak dapat ditampilkan karena ada kesalahan tak terduga. Coba
          muat ulang atau kembali ke beranda.
        </p>

        <div className="mt-8 flex items-center justify-center">
          <a
            href="/"
            className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#C9A24B] text-[#2A1F08] text-[13px] tracking-wide hover:bg-[#D4B05E] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#C9A24B] focus-visible:ring-offset-[#EFEBE1] dark:focus-visible:ring-offset-[#0B1215]"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    </div>
  );
}

export function RouterErrorBoundary() {
  const error = useRouteError();
  console.error("[RouterErrorBoundary]", error);
  return <ErrorFallback />;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return <ErrorFallback />;
  }
}
