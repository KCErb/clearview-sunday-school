export function LogoMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="cwass-bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2F6FED" />
          <stop offset="1" stopColor="#5AA0FF" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#cwass-bg)" />
      <circle cx="256" cy="196" r="58" fill="#FFFFFF" fillOpacity="0.95" />
      <path
        d="M256 300c-34-26-78-30-118-22-9 2-16 10-16 19v92c0 6 6 10 12 9 38-8 80-4 110 18 8 6 16 6 24 0 30-22 72-26 110-18 6 1 12-3 12-9v-92c0-9-7-17-16-19-40-8-84-4-118 22z"
        fill="#FFFFFF"
      />
      <path d="M256 300v118" stroke="#2F6FED" strokeWidth="10" strokeLinecap="round" />
    </svg>
  );
}

/** Circular portrait of Christ (Heinrich Hofmann, public domain) used as the app mark. */
export function ChristMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <img
      src="/art/christ-detail.jpg"
      alt=""
      aria-hidden="true"
      className={`shrink-0 rounded-full object-cover object-center ring-1 ring-black/5 ${className}`}
    />
  );
}

export function Wordmark() {
  return (
    <div className="flex items-center gap-3">
      <ChristMark className="h-9 w-9" />
      <div className="text-sm font-bold leading-tight tracking-tight text-ink">
        Clearview Ward Adult Sunday School
      </div>
    </div>
  );
}
