import type { InputHTMLAttributes, ReactNode } from "react";

export function Field({
  label,
  hint,
  error,
  icon,
  trailing,
  ...props
}: {
  label: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>) {
  const hasError = Boolean(error);
  return (
    <label className="block">
      <span className="block text-[13px] text-[#4A5550] dark:text-[#B8BFB9] mb-1.5">
        {label}
      </span>
      <div className="relative">
        {icon && (
          <span
            className={`pointer-events-none absolute inset-y-0 left-3 flex items-center ${hasError ? "text-[#A04848] dark:text-[#D17878]" : "text-[#5F6A64] dark:text-[#A8AFA9]"}`}
          >
            {icon}
          </span>
        )}
        <input
          {...props}
          aria-invalid={hasError || undefined}
          className={`w-full rounded-lg border bg-white/60 dark:bg-white/[0.05] py-2.5 text-[14px] text-[#2A3530] dark:text-[#E8E6DF] placeholder-[#5F6A64] dark:placeholder-[#A8AFA9] outline-none focus:ring-2 transition-colors ${
            hasError
              ? "border-[#A04848]/55 focus:border-[#A04848] focus:ring-[#A04848]/20 dark:border-[#D17878]/55 dark:focus:border-[#D17878] dark:focus:ring-[#D17878]/25"
              : "border-[#2A3530]/15 dark:border-[#E8E6DF]/15 focus:border-[#C9A24B] dark:focus:border-[#C9A24B] focus:ring-[#C9A24B]/20"
          } ${icon ? "pl-10" : "pl-3.5"} ${trailing ? "pr-10" : "pr-3.5"}`}
        />
        {trailing && (
          <span className="absolute inset-y-0 right-2 flex items-center">
            {trailing}
          </span>
        )}
      </div>
      {hasError ? (
        <span className="block mt-1.5 text-[12px] text-[#A04848] dark:text-[#D17878]">
          {error}
        </span>
      ) : hint ? (
        <span className="block mt-1.5 text-[12px] text-[#5F6A64] dark:text-[#A8AFA9]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function OrDivider({ label = "atau" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="h-px flex-1 bg-[#2A3530]/12 dark:bg-[#E8E6DF]/12" />
      <span className="text-[11px] uppercase tracking-wider text-[#5F6A64] dark:text-[#A8AFA9]">
        {label}
      </span>
      <span className="h-px flex-1 bg-[#2A3530]/12 dark:bg-[#E8E6DF]/12" />
    </div>
  );
}

export function GoogleButton({
  children,
  ...props
}: InputHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <button
      type="button"
      {...(props as any)}
      className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-lg border border-[#2A3530]/15 dark:border-[#E8E6DF]/15 bg-white/60 dark:bg-white/[0.05] text-[#2A3530] dark:text-[#E8E6DF] text-[13px] tracking-wide hover:border-[#C9A24B] dark:hover:border-[#C9A24B] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24B]/50"
    >
      <GoogleIcon />
      {children}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 110-24c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 1024 44c11 0 20-9 20-20 0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 006.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3a12 12 0 01-18-6.1l-6.6 5.1A20 20 0 0024 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3a12 12 0 01-4 5.5l6.3 5.3C41.4 35.7 44 30.3 44 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

export function PrimaryButton({
  children,
  ...props
}: InputHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <button
      {...(props as any)}
      className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#C9A24B] text-[#2A1F08] text-[13px] tracking-wide hover:bg-[#D4B05E] transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-[#C9A24B] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#C9A24B] focus-visible:ring-offset-[#EFEBE1] dark:focus-visible:ring-offset-[#0B1215]"
    >
      {children}
    </button>
  );
}
