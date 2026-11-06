export function Brand() {
  return (
    <span className="brand">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <rect width="36" height="36" rx="11" fill="currentColor" />
        <path
          d="M9 18 18 10l9 8M12 16v11h12V16M16 27v-7h4v7"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>
        우리땅<span className="brand-dot">.</span>
      </span>
    </span>
  )
}
