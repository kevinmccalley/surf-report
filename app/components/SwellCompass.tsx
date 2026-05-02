'use client'

interface Props {
  primaryDirection: number
  secondaryDirection?: number
  size?: number
}

export default function SwellCompass({ primaryDirection, secondaryDirection, size = 140 }: Props) {
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 4
  const innerR = r - 14
  const arrowLen = innerR - 6

  const toRad = (deg: number) => (deg * Math.PI) / 180

  const cardinals = [
    { label: 'N', angle: 0 },
    { label: 'E', angle: 90 },
    { label: 'S', angle: 180 },
    { label: 'W', angle: 270 },
  ]

  const intercardinals = [45, 135, 225, 315]

  // Arrow coords: tip at swell origin on compass edge, pointing toward center
  function arrowPoints(direction: number) {
    const rad = toRad(direction - 90) // -90 to align 0° with top
    const tipX = cx + innerR * Math.cos(rad)
    const tipY = cy + innerR * Math.sin(rad)
    // Arrow body: from edge toward center
    const tailX = cx + 12 * Math.cos(rad + Math.PI)
    const tailY = cy + 12 * Math.sin(rad + Math.PI)
    // Arrowhead: perpendicular lines at tip
    const headLen = 9
    const headAngle = 0.45
    const h1x = tipX + headLen * Math.cos(rad + Math.PI + headAngle)
    const h1y = tipY + headLen * Math.sin(rad + Math.PI + headAngle)
    const h2x = tipX + headLen * Math.cos(rad + Math.PI - headAngle)
    const h2y = tipY + headLen * Math.sin(rad + Math.PI - headAngle)
    return { tipX, tipY, tailX, tailY, h1x, h1y, h2x, h2y }
  }

  const primary = arrowPoints(primaryDirection)
  const secondary = secondaryDirection !== undefined ? arrowPoints(secondaryDirection) : null

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Swell direction compass">
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      {/* Inner ring */}
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r="2.5" fill="rgba(255,255,255,0.15)" />

      {/* Tick marks for intercardinals */}
      {intercardinals.map(angle => {
        const rad = toRad(angle - 90)
        const x1 = cx + (r - 5) * Math.cos(rad)
        const y1 = cy + (r - 5) * Math.sin(rad)
        const x2 = cx + (r - 10) * Math.cos(rad)
        const y2 = cy + (r - 10) * Math.sin(rad)
        return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      })}

      {/* Cardinal labels */}
      {cardinals.map(({ label, angle }) => {
        const rad = toRad(angle - 90)
        const labelR = r - 7
        const x = cx + labelR * Math.cos(rad)
        const y = cy + labelR * Math.sin(rad)
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="9"
            fontWeight="600"
            fill={label === 'N' ? '#94a3b8' : 'rgba(148,163,184,0.5)'}
            className="select-none"
          >
            {label}
          </text>
        )
      })}

      {/* Secondary swell arrow (drawn behind primary) */}
      {secondary && (
        <g opacity="0.4">
          <line
            x1={secondary.tailX} y1={secondary.tailY}
            x2={secondary.tipX} y2={secondary.tipY}
            stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"
            strokeDasharray="3 2"
          />
          <path
            d={`M ${secondary.tipX} ${secondary.tipY} L ${secondary.h1x} ${secondary.h1y} L ${secondary.h2x} ${secondary.h2y} Z`}
            fill="#38bdf8"
          />
        </g>
      )}

      {/* Primary swell arrow with glow */}
      <g>
        {/* Glow effect */}
        <line
          x1={primary.tailX} y1={primary.tailY}
          x2={primary.tipX} y2={primary.tipY}
          stroke="#0ea5e9" strokeWidth="6" strokeLinecap="round" opacity="0.15"
        />
        <line
          x1={primary.tailX} y1={primary.tailY}
          x2={primary.tipX} y2={primary.tipY}
          stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round"
        />
        <path
          d={`M ${primary.tipX} ${primary.tipY} L ${primary.h1x} ${primary.h1y} L ${primary.h2x} ${primary.h2y} Z`}
          fill="#0ea5e9"
        />
        {/* Dot at origin */}
        <circle cx={primary.tipX} cy={primary.tipY} r="3.5" fill="#0ea5e9" opacity="0.7" />
      </g>
    </svg>
  )
}
