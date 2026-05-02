export default function TideSetupCard() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-5 py-4 rounded-xl border border-teal-500/20 bg-teal-500/5">
      <div className="text-2xl shrink-0">🌊</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-teal-300">Enable Tide Data</p>
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
          Add a free{' '}
          <a
            href="https://www.worldtides.info/developer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
          >
            WorldTides API key
          </a>
          {' '}as{' '}
          <code className="px-1 py-0.5 rounded bg-white/5 text-teal-300 font-mono text-xs">
            WORLDTIDES_API_KEY
          </code>
          {' '}in your Vercel environment variables to unlock tidal predictions worldwide.
        </p>
      </div>
    </div>
  )
}
