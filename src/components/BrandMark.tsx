export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="32" height="32" rx="8" fill="#0f172a" />
      <rect x="7" y="8" width="18" height="16" rx="3" stroke="#38bdf8" strokeWidth="2" />
      <path
        d="M11 13h10M11 17h7M11 21h5"
        stroke="#818cf8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="22" cy="21" r="3" fill="#38bdf8" />
    </svg>
  );
}
