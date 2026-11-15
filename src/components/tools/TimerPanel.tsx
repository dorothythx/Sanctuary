import { useEffect, useState } from 'react'
import { Check, Flag, Pause, Play, RotateCcw } from 'lucide-react'
import { PRESETS, TIMER_LIMITS, cdRemaining, cdTotal, swElapsed, timer, useTimerState } from '../../services/timerStore'
import type { Lap, Preset, TimerState } from '../../types'

const pad = (n: number) => String(n).padStart(2, '0')
function parts(ms: number) { const t = Math.floor(ms); return { h: Math.floor(t / 3600000), m: Math.floor(t / 60000) % 60, s: Math.floor(t / 1000) % 60, ms: t % 1000 } }
const lapFmt = (ms: number) => { const p = parts(ms); return `${p.h ? pad(p.h) + ':' : ''}${pad(p.m)}:${pad(p.s)}.${String(p.ms).padStart(3, '0')}` }

/** Display-only clock for this component; engine state never depends on it. */
function useNow(active: boolean, every: 'frame' | number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    setNow(Date.now())
    if (!active) return
    const sync = () => setNow(Date.now())
    document.addEventListener('visibilitychange', sync)
    let id = 0
    if (every === 'frame') { const loop = () => { setNow(Date.now()); id = requestAnimationFrame(loop) }; id = requestAnimationFrame(loop) }
    else id = window.setInterval(sync, every)
    return () => { document.removeEventListener('visibilitychange', sync); every === 'frame' ? cancelAnimationFrame(id) : clearInterval(id) }
  }, [active, every])
  return now
}

const btn = 'flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 text-sm transition-colors disabled:pointer-events-none disabled:opacity-40'
const primary = `${btn} glass-active flex-1`
const secondary = `${btn} glass-chip`

function SwTime({ sw }: { sw: TimerState['sw'] }) {
  const now = useNow(sw.running, 'frame')
  const p = parts(swElapsed(sw, now))
  return (
    <div className="py-3 text-center tabular-nums" role="timer" aria-label="Stopwatch elapsed time">
      <span className="font-display text-5xl leading-none tracking-wide">{pad(p.h)}:{pad(p.m)}:{pad(p.s)}</span>
      <span className="ml-1 text-sm opacity-60">.{String(p.ms).padStart(3, '0')}</span>
    </div>
  )
}

function Stopwatch({ sw }: { sw: TimerState['sw'] }) {
  const hasTime = sw.running || sw.accumulated > 0
  const splits = sw.laps.map(l => l.split)
  const fast = sw.laps.length >= 2 ? Math.min(...splits) : -1
  const slow = sw.laps.length >= 2 ? Math.max(...splits) : -1
  const tag = (l: Lap) => (fast === slow ? '' : l.split === fast ? 'Fastest' : l.split === slow ? 'Slowest' : '')
  return (
    <div>
      <SwTime sw={sw} />
      <div className="flex gap-2">
        <button className={primary} onClick={sw.running ? timer.swPause : timer.swStart}>
          {sw.running ? <><Pause size={16} />Pause</> : <><Play size={16} />{sw.accumulated > 0 ? 'Resume' : 'Start'}</>}
        </button>
        <button className={secondary} disabled={!sw.running} onClick={timer.swLap} aria-label="Record lap"><Flag size={16} />Lap</button>
        <button className={secondary} disabled={!hasTime} onClick={timer.swReset} aria-label="Reset stopwatch"><RotateCcw size={16} /></button>
      </div>
      {sw.laps.length > 0 && (
        <ol className="mt-3 max-h-40 overflow-auto text-sm tabular-nums" aria-label="Laps">
          {[...sw.laps].reverse().map(l => (
            <li key={l.n} className="flex items-baseline justify-between gap-2 border-t border-[#2f4a35]/10 py-1.5">
              <span className="w-6 opacity-70">{l.n}</span>
              <span className="flex-1">{lapFmt(l.split)}{tag(l) && <em className={`ml-2 text-[11px] not-italic uppercase tracking-wider ${tag(l) === 'Fastest' ? 'font-medium' : 'opacity-60'}`}>{tag(l)}</em>}</span>
              <span className="text-xs opacity-65">{lapFmt(l.total)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function DurationField({ minutes, disabled }: { minutes: number; disabled: boolean }) {
  const [draft, setDraft] = useState(String(minutes))
  const commit = () => { const v = parseInt(draft, 10); if (Number.isFinite(v)) timer.cdSetMinutes(v); setDraft(String(minutes)) }
  return (
    <label className="mt-3 flex items-center justify-center gap-2 text-xs">
      Duration
      <input type="number" inputMode="numeric" min={TIMER_LIMITS.MIN_M} max={TIMER_LIMITS.MAX_M} value={draft} disabled={disabled} aria-label="Duration in minutes"
        onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
        className="glass-chip min-h-10 w-16 rounded-full text-center text-sm outline-none disabled:opacity-50" />
      min
    </label>
  )
}

function Focus({ cd }: { cd: TimerState['cd'] }) {
  const running = cd.status === 'running'
  const now = useNow(running, 250)
  useEffect(() => { if (cd.unseen) timer.dismiss() }, [cd.unseen])
  const total = cdTotal(cd)
  const remaining = cdRemaining(cd, now)
  const secs = Math.ceil(remaining / 1000)
  const finished = cd.status === 'finished'
  const h = Math.floor(secs / 3600), m = Math.floor(secs / 60) % 60, s = secs % 60
  const R = 52, C = 2 * Math.PI * R
  const progress = finished ? 1 : total ? remaining / total : 0
  return (
    <div>
      <div className="flex gap-1.5" role="group" aria-label="Timer preset">
        {(Object.keys(PRESETS) as Preset[]).map(k => (
          <button key={k} disabled={running} aria-pressed={cd.preset === k} onClick={() => timer.cdSelect(k)}
            className={`flex min-h-11 flex-1 flex-col items-center justify-center rounded-2xl px-1 text-xs leading-tight transition-colors disabled:pointer-events-none ${cd.preset === k ? 'glass-active' : 'glass-chip'} ${running && cd.preset !== k ? 'opacity-45' : ''}`}>
            {PRESETS[k].label}<span className="text-[11px] opacity-70">{cd.minutes[k]} min</span>
          </button>
        ))}
      </div>
      <div className="relative mx-auto mt-3 h-36 w-36" role="timer" aria-label="Countdown">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(47,74,53,.16)" strokeWidth="5" />
          <circle cx="60" cy="60" r={R} fill="none" stroke="#2f4a35" strokeWidth="5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - progress)} style={{ transition: 'stroke-dashoffset .25s linear' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center tabular-nums">
          <span className="font-display text-4xl leading-none">{h > 0 ? `${pad(h)}:` : ''}{pad(m)}:{pad(s)}</span>
          <span className="mt-1 flex items-center gap-1 text-xs opacity-75" aria-live="polite">
            {finished ? <><Check size={13} strokeWidth={2.2} />Session complete</> : cd.status === 'paused' ? 'Paused' : running ? PRESETS[cd.preset].label : 'Ready'}
          </span>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button className={primary} onClick={running ? timer.cdPause : timer.cdStart}>
          {running ? <><Pause size={16} />Pause</> : <><Play size={16} />{finished ? 'Restart' : cd.status === 'paused' ? 'Resume' : 'Start'}</>}
        </button>
        <button className={secondary} disabled={cd.status === 'idle'} onClick={timer.cdReset} aria-label="Reset timer"><RotateCcw size={16} /></button>
      </div>
      <DurationField key={`${cd.preset}-${cd.minutes[cd.preset]}`} minutes={cd.minutes[cd.preset]} disabled={cd.status === 'running' || cd.status === 'paused'} />
    </div>
  )
}

export function TimerPanel() {
  const { tab, sw, cd } = useTimerState()
  return (
    <div>
      <div role="tablist" aria-label="Stopwatch or focus timer" className="flex gap-1.5">
        {([['stopwatch', 'Stopwatch'], ['focus', 'Focus Timer']] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => timer.setTab(id)} className={`min-h-10 flex-1 rounded-full px-3 text-sm transition-colors ${tab === id ? 'glass-active' : 'glass-chip'}`}>{label}</button>
        ))}
      </div>
      <div role="tabpanel" className="mt-2">{tab === 'stopwatch' ? <Stopwatch sw={sw} /> : <Focus cd={cd} />}</div>
    </div>
  )
}
