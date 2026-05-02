interface Props {
  code: number
  size?: number
  className?: string
}

export default function WeatherIcon({ code, size = 20, className }: Props) {
  const emoji = codeToEmoji(code)
  return (
    <span
      role="img"
      aria-label={codeToLabel(code)}
      style={{ fontSize: size * 0.9 }}
      className={className}
    >
      {emoji}
    </span>
  )
}

function codeToEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code === 1) return '🌤'
  if (code === 2) return '⛅️'
  if (code === 3) return '☁️'
  if (code <= 48) return '🌫'
  if (code <= 55) return '🌦'
  if (code <= 65) return '🌧'
  if (code <= 67) return '🌨'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌦'
  if (code <= 86) return '🌨'
  if (code === 95) return '⛈'
  return '🌩'
}

function codeToLabel(code: number): string {
  if (code === 0) return 'clear sky'
  if (code <= 2) return 'partly cloudy'
  if (code === 3) return 'overcast'
  if (code <= 48) return 'fog'
  if (code <= 55) return 'drizzle'
  if (code <= 65) return 'rain'
  if (code <= 77) return 'snow'
  if (code <= 82) return 'rain showers'
  if (code <= 86) return 'snow showers'
  return 'thunderstorm'
}
