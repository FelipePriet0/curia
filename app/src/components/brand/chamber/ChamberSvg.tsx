type ChamberSvgProps = {
  className?: string
}

export function ChamberSvg({ className = 'w-full max-w-[260px]' }: ChamberSvgProps) {
  const seats = [
    { cx: 150, cy: 52 },
    { cx: 210, cy: 76 },
    { cx: 210, cy: 128 },
    { cx: 150, cy: 154 },
    { cx: 90, cy: 128 },
    { cx: 90, cy: 76 },
  ]

  return (
    <svg viewBox="0 0 300 210" className={className} aria-hidden>
      <defs>
        <radialGradient id="brand-chamber-mg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--chamber-obsidian)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--chamber-obsidian)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="brand-chamber-fg" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="var(--chamber-silver)" stopOpacity="0.88" />
          <stop offset="100%" stopColor="var(--chamber-text-secondary)" stopOpacity="0.78" />
        </radialGradient>
      </defs>

      <path
        d="M 150 35 L 268 98 L 150 162 L 32 98 Z"
        fill="url(#brand-chamber-fg)"
        stroke="var(--chamber-obsidian)"
        strokeOpacity="0.12"
        strokeWidth="1"
      />

      <path
        d="M 268 98 L 150 162 L 150 192 L 268 128 Z"
        fill="var(--chamber-text-secondary)"
        fillOpacity="0.8"
        stroke="none"
      />

      <path
        d="M 32 98 L 150 162 L 150 192 L 32 128 Z"
        fill="var(--chamber-obsidian)"
        fillOpacity="0.45"
        stroke="none"
      />

      <line
        x1="150"
        y1="162"
        x2="150"
        y2="192"
        stroke="var(--chamber-obsidian)"
        strokeOpacity="0.14"
        strokeWidth="1"
      />

      <ellipse
        cx="150"
        cy="98"
        rx="48"
        ry="28"
        fill="var(--chamber-obsidian)"
        fillOpacity="0.08"
        stroke="var(--chamber-obsidian)"
        strokeOpacity="0.18"
        strokeWidth="1"
      />

      <circle cx="150" cy="98" r="34" fill="url(#brand-chamber-mg)" />
      <circle cx="150" cy="98" r="12" fill="var(--chamber-obsidian)" fillOpacity="0.18" />
      <circle cx="150" cy="98" r="5" fill="var(--chamber-obsidian)" fillOpacity="0.6" />

      {seats.map((seat, index) => (
        <g key={index}>
          <circle
            cx={seat.cx}
            cy={seat.cy}
            r={7}
            fill="var(--chamber-obsidian)"
            fillOpacity="0.85"
            stroke="var(--chamber-obsidian)"
            strokeOpacity="0.35"
            strokeWidth="1.5"
          />
          <circle
            cx={seat.cx}
            cy={seat.cy}
            r={2.5}
            fill="var(--chamber-obsidian)"
            fillOpacity="0.6"
          />
        </g>
      ))}
    </svg>
  )
}
