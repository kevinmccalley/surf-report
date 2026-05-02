interface Props {
  reason?: string
}

export default function TideSetupCard({ reason }: Props) {
  void reason
  return (
    <div className="flex items-start gap-4 px-5 py-4 rounded-xl border border-slate-700/50 bg-white/3">
      <span className="text-xl shrink-0 mt-0.5">📡</span>
      <div>
        <p className="text-sm font-semibold text-slate-300">Tide data temporarily unavailable</p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Could not retrieve tidal predictions for this location. Try refreshing.
          Tide data is sourced from NOAA CO-OPS, DFO, and the Open-Meteo global tidal model — all free, no API key required.
        </p>
      </div>
    </div>
  )
}
