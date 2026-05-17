'use client'

interface SwellEntry {
  direction: number
  color: string
  opacity?: number
  dashed?: boolean
}

interface Props {
  swells: SwellEntry[]
  size?: number
}

export default function SwellCompass({ swells, size = 140 }: Props) {
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 4
  const innerR = r - 14

  const toRad = (deg: number) => (deg * Math.PI) / 180

  const cardinals = [
    { label: 'N', angle: 0 },
    { label: 'E', angle: 90 },
    { label: 'S', angle: 180 },
    { label: 'W', angle: 270 },
  ]

  const intercardinals = [45, 135, 225, 315]

  function arrowPoints(direction: number) {
    const rad = toRad(direction - 90)
    const tipX = cx + innerR * Math.cos(rad)
    const tipY = cy + innerR * Math.sin(rad)
    const tailX = cx + 12 * Math.cos(rad + Math.PI)
    const tailY = cy + 12 * Math.sin(rad + Math.PI)
    const headLen = 9
    const headAngle = 0.45
    const h1x = tipX + headLen * Math.cos(rad + Math.PI + headAngle)
    const h1y = tipY + headLen * Math.sin(rad + Math.PI + headAngle)
    const h2x = tipX + headLen * Math.cos(rad + Math.PI - headAngle)
    const h2y = tipY + headLen * Math.sin(rad + Math.PI - headAngle)
    return { tipX, tipY, tailX, tailY, h1x, h1y, h2x, h2y }
  }

  const primary = swells[0] ? arrowPoints((swells[0].direction + 180) % 360) : null

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Swell direction compass">
      <circle cx={cx} cy={cy} r={r} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r="2.5" fill="rgba(255,255,255,0.15)" />

      {intercardinals.map(angle => {
        const rad = toRad(angle - 90)
        const x1 = cx + (r - 5) * Math.cos(rad)
        const y1 = cy + (r - 5) * Math.sin(rad)
        const x2 = cx + (r - 10) * Math.cos(rad)
        const y2 = cy + (r - 10) * Math.sin(rad)
        return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      })}

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

      {/* Secondary/additional swells drawn behind primary */}
      {swells.slice(1).map((swell, i) => {
        const pts = arrowPoints((swell.direction + 180) % 360)
        const opacity = swell.opacity ?? Math.max(0.25, 0.45 - i * 0.1)
        return (
          <g key={i} opacity={opacity}>
            <line
              x1={pts.tailX} y1={pts.tailY}
              x2={pts.tipX} y2={pts.tipY}
              stroke={swell.color} strokeWidth="2" strokeLinecap="round"
              strokeDasharray={swell.dashed ? '3 2' : undefined}
            />
            <path
              d={`M ${pts.tipX} ${pts.tipY} L ${pts.h1x} ${pts.h1y} L ${pts.h2x} ${pts.h2y} Z`}
              fill={swell.color}
            />
          </g>
        )
      })}

      {/* Primary swell with glow */}
      {primary && swells[0] && (
        <g>
          <line
            x1={primary.tailX} y1={primary.tailY}
            x2={primary.tipX} y2={primary.tipY}
            stroke={swells[0].color} strokeWidth="6" strokeLinecap="round" opacity="0.15"
          />
          <line
            x1={primary.tailX} y1={primary.tailY}
            x2={primary.tipX} y2={primary.tipY}
            stroke={swells[0].color} strokeWidth="2.5" strokeLinecap="round"
          />
          <path
            d={`M ${primary.tipX} ${primary.tipY} L ${primary.h1x} ${primary.h1y} L ${primary.h2x} ${primary.h2y} Z`}
            fill={swells[0].color}
          />
          <circle cx={primary.tipX} cy={primary.tipY} r="3.5" fill={swells[0].color} opacity="0.7" />
        </g>
      )}
    </svg>
  )
}
