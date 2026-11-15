import { useEffect, useState } from 'react'
/** Ticks on real second boundaries; stops while the tab is hidden and resyncs on return. */
export function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let t = 0
    const tick = () => {
      const d = new Date(); setNow(d)
      if (!document.hidden) t = window.setTimeout(tick, 1000 - d.getMilliseconds() + 5)
    }
    const onVis = () => { window.clearTimeout(t); if (!document.hidden) tick() }
    tick(); document.addEventListener('visibilitychange', onVis)
    return () => { window.clearTimeout(t); document.removeEventListener('visibilitychange', onVis) }
  }, [])
  return now
}
