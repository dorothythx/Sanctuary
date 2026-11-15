import { memo } from 'react'
import { useClock } from '../../hooks/useClock'
const pad = (n: number) => String(n).padStart(2, '0')
export const ClockWidget = memo(function ClockWidget({ hour12, showDate }: { hour12: boolean; showDate: boolean }) {
  const now = useClock()
  const h = now.getHours()
  const time = `${pad(hour12 ? h % 12 || 12 : h)}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  return (
    <div className="glass rounded-2xl px-4 py-2.5 text-right text-[#2f4a35]" role="timer" aria-label="Current time">
      <div className="font-display text-5xl font-medium leading-none tracking-wide tabular-nums">
        {time}{hour12 && <span className="ml-1.5 text-lg">{h < 12 ? 'AM' : 'PM'}</span>}
      </div>
      {showDate && <div className="mt-1.5 text-sm tracking-wide opacity-85">
        {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>}
    </div>
  )
})
