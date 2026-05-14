import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #020917 0%, #0c1a2e 60%, #0f2040 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Wave accent bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: 'linear-gradient(90deg, #0ea5e9, #38bdf8, #7dd3fc)',
          }}
        />
        {/* Logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <svg width="72" height="72" viewBox="0 0 48 48" fill="none">
            <path
              d="M4 32 C10 20, 18 28, 24 16 C30 4, 38 24, 44 20"
              stroke="#38bdf8"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M4 40 C10 28, 18 36, 24 24 C30 12, 38 32, 44 28"
              stroke="#7dd3fc"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.6"
            />
          </svg>
          <span style={{ color: '#f8fafc', fontSize: 64, fontWeight: 700, letterSpacing: '-2px' }}>
            Groundswell
          </span>
        </div>
        <div style={{ color: '#94a3b8', fontSize: 30, fontWeight: 400, letterSpacing: '0.5px' }}>
          Surf Reports Worldwide
        </div>
        <div
          style={{
            marginTop: 32,
            display: 'flex',
            gap: 32,
            color: '#475569',
            fontSize: 18,
          }}
        >
          <span>Wave height</span>
          <span>·</span>
          <span>Swell</span>
          <span>·</span>
          <span>Wind</span>
          <span>·</span>
          <span>Tides</span>
          <span>·</span>
          <span>10-day forecast</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
