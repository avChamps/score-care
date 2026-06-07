export function ButtonLoader({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`size-6 animate-spin ${className}`}
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="3" />
      <path
        d="M20.5 12a8.5 8.5 0 0 1-8.5 8.5"
        fill="none"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}
