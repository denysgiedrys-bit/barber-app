export default function Logo({ size = 40, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="40" height="40" rx="10" fill="#fbbf24"/>
      {/* Left blade */}
      <path d="M15 27 L27 11" stroke="#1c1917" strokeWidth="2.8" strokeLinecap="round"/>
      {/* Right blade */}
      <path d="M25 27 L13 11" stroke="#1c1917" strokeWidth="2.8" strokeLinecap="round"/>
      {/* Left handle ring */}
      <circle cx="13" cy="29" r="4" stroke="#1c1917" strokeWidth="2.2" fill="none"/>
      {/* Right handle ring */}
      <circle cx="27" cy="29" r="4" stroke="#1c1917" strokeWidth="2.2" fill="none"/>
      {/* Pivot */}
      <circle cx="20" cy="19" r="2" fill="#1c1917"/>
    </svg>
  )
}
