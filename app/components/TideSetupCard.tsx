interface Props {
  reason?: string
  nearestStationName?: string
  nearestStationDistanceKm?: number
}

export default function TideSetupCard({ reason, nearestStationName, nearestStationDistanceKm }: Props) {
  if (reason === 'out_of_range') {
    return (
      <div className="flex items-start gap-4 px-5 py-4 rounded-xl border border-slate-700/50 bg-white/3">
        <span className="text-xl shrink-0 mt-0.5">🌐</span>
        <div>
          <p className="text-sm font-semibold text-slate-300">Tide data not available here</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Tidal predictions are sourced from{' '}
            <a
              href="https://tidesandcurrents.noaa.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 underline underline-offset-2 hover:text-slate-300"
            >
              NOAA CO-OPS
            </a>{' '}
            at no cost. The nearest NOAA station
            {nearestStationName ? ` (${nearestStationName})` : ''} is{' '}
            {nearestStationDistanceKm ? `${nearestStationDistanceKm} km away` : 'too far'} — outside the
            500 km range for reliable tidal predictions. US coasts, Hawaii, and US territories are
            fully supported.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-4 px-5 py-4 rounded-xl border border-slate-700/50 bg-white/3">
      <span className="text-xl shrink-0 mt-0.5">📡</span>
      <div>
        <p className="text-sm font-semibold text-slate-300">Tide data unavailable</p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Could not retrieve tidal predictions for this location. Try refreshing,
          or check back shortly. Tide data is sourced from{' '}
          <a
            href="https://tidesandcurrents.noaa.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 underline underline-offset-2 hover:text-slate-300"
          >
            NOAA CO-OPS
          </a>{' '}
          (free, no API key required).
        </p>
      </div>
    </div>
  )
}
