let uid = 0

export default function Logo({ className, height = 52 }) {
  const id = `lg${++uid}`
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50"
      className={className}
      style={{ height, width: 'auto', display: 'block' }}
      role="img"
      aria-label="AddisDR"
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00c8ff" />
          <stop offset="100%" stopColor="#00ff88" />
        </linearGradient>
      </defs>
      <text
        x="0" y="38"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="36"
        fontWeight="800"
        fill={`url(#${id})`}
      >
        AddisDR
      </text>
    </svg>
  )
}
