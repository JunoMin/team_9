export function Brand() {
  return (
    <span className="brand">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <rect width="36" height="36" rx="11" fill="currentColor" />
        <path
          d="M18 6.5a6.2 6.2 0 0 0-6.2 6.2c0 4.6 6.2 10.3 6.2 10.3s6.2-5.7 6.2-10.3A6.2 6.2 0 0 0 18 6.5Z"
          fill="white"
        />
        <circle cx="18" cy="12.7" r="2.3" fill="currentColor" />
        <path
          d="M11 24h14l5 7H6ZM15.7 24 14 31M20.3 24 22 31M8.5 27.5h19"
          fill="white"
          fillOpacity=".25"
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>
        내땅어디<span className="brand-dot">.</span>
      </span>
    </span>
  )
}
