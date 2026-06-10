type Props = {
  size?: number;
  className?: string;
};

export function BrandMark({ size = 18, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M32 58 L 32 30"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M32 34 C 20 32 12 22 12 12 C 22 12 30 20 32 32 Z"
        fill="currentColor"
      />
      <path
        d="M32 34 C 44 32 52 22 52 12 C 42 12 34 20 32 32 Z"
        fill="currentColor"
        opacity="0.75"
      />
    </svg>
  );
}
