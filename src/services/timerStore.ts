import { useEffect, useSyncExternalStore } from 'react'
import type { Lap, Preset, TimerState } from '../types'

/**
 * Timer engine. Lives outside React so a running stopwatch/countdown is independent of
 * whether the panel is mounted. State holds only timestamps; nothing ticks here.
 * The single setTimeout below only fires the completion event.
 */
export const KEY = 'sanctuary:timer'
export const PRESETS: Record<Preset, { label: string; minutes: number }> = {
  focus: { label: 'Focus', minutes: 25 }, short: { label: 'Short break', minutes: 5 }, long: { label: 'Long break', minutes: 15 },
}
const MIN_M = 1, MAX_M = 180, MAX_LAPS = 500
const num = (v: unknown, d: number, lo = -Infinity, hi = Infinity) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d)
const defaultMinutes = (): Record<Preset, number> => ({ focus: 25, short: 5, long: 15 })

function defaults(): TimerState {
  return { tab: 'stopwatch', sw: { running: false, startedAt: 0, accumulated: 0, laps: [] },
    cd: { preset: 'focus', minutes: defaultMinutes(), status: 'idle', endAt: 0, remainingMs: 25 * 60000, unseen: false } }
}

/** Validate untrusted stored data and settle anything that expired while the page was closed. */
export function sanitize(raw: unknown, now: number): TimerState {
  const d = defaults()
  if (!raw || typeof raw !== 'object') return d
  const o = raw as Record<string, any>
  const s = (o.sw && typeof o.sw === 'object' ? o.sw : {}) as Record<string, any>
  const laps: Lap[] = Array.isArray(s.laps)
    ? s.laps.slice(0, MAX_LAPS).filter((l: unknown) => l && typeof l === 'object').map((l: any, i: number) => ({ n: Math.round(num(l.n, i + 1, 1)), split: num(l.split, 0, 0), total: num(l.total, 0, 0) })) : []
  let running = s.running === true
  let startedAt = num(s.startedAt, 0, 0)
  if (running && startedAt <= 0) running = false
  if (running && startedAt > now) startedAt = now
  const sw = { running, startedAt: running ? startedAt : 0, accumulated: num(s.accumulated, 0, 0, 1e11), laps }

  const c = (o.cd && typeof o.cd === 'object' ? o.cd : {}) as Record<string, any>
  const preset: Preset = typeof c.preset === 'string' && c.preset in PRESETS ? (c.preset as Preset) : 'focus'
  const minutes = defaultMinutes()
  ;(Object.keys(minutes) as Preset[]).forEach(k => { minutes[k] = Math.round(num(c.minutes?.[k], minutes[k], MIN_M, MAX_M)) })
  const total = minutes[preset] * 60000
  let status: TimerState['cd']['status'] = ['idle', 'running', 'paused', 'finished'].includes(c.status) ? c.status : 'idle'
  let endAt = num(c.endAt, 0, 0)
  let remainingMs = num(c.remainingMs, total, 0, total)
  let unseen = c.unseen === true
  if (status === 'running') {
    if (endAt <= 0) { status = 'idle' }
    else if (endAt <= now) { status = 'finished'; unseen = true }
    else endAt = Math.min(endAt, now + total)
  }
  if (status === 'paused' && remainingMs <= 0) status = 'idle'
  if (status === 'idle') remainingMs = total
  if (status === 'finished') remainingMs = 0
  if (status !== 'running') endAt = 0
  return { tab: o.tab === 'focus' ? 'focus' : 'stopwatch', sw, cd: { preset, minutes, status, endAt, remainingMs, unseen: status === 'finished' && unseen } }
}

function load(): TimerState {
  try { const raw = localStorage.getItem(KEY); return sanitize(raw === null ? null : JSON.parse(raw), Date.now()) } catch { return defaults() }
}

let state: TimerState = load()
const listeners = new Set<() => void>()
let timeout = 0
const emit = () => listeners.forEach(l => l())

function commit(next: TimerState) {
  state = next
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
  emit(); schedule()
}
function schedule() {
  window.clearTimeout(timeout)
  if (state.cd.status === 'running') timeout = window.setTimeout(check, Math.max(0, state.cd.endAt - Date.now()) + 20)
}
function check() {
  if (state.cd.status === 'running' && Date.now() >= state.cd.endAt) finish()
  else schedule()
}
function finish() {
  commit({ ...state, cd: { ...state.cd, status: 'finished', endAt: 0, remainingMs: 0, unseen: true } })
  // Only uses an existing grant; permission is never requested here.
  try {
    if ('Notification' in window && Notification.permission === 'granted')
      new Notification('Sanctuary', { body: `${PRESETS[state.cd.preset].label} complete`, tag: 'sanctuary-timer' })
  } catch { /* some platforms disallow the constructor */ }
}

/** Attach engine listeners (visibility resync, cross-tab sync). Call once from the app root. */
export function startEngine() {
  const onVis = () => { if (!document.hidden) { check(); emit() } }
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { state = load(); emit(); schedule() } }
  document.addEventListener('visibilitychange', onVis)
  window.addEventListener('storage', onStorage)
  check()
  return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('storage', onStorage); window.clearTimeout(timeout) }
}
export function useTimerEngine() { useEffect(startEngine, []) }
export function useTimerState() {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb) } }, () => state)
}

export const swElapsed = (sw: TimerState['sw'], now: number) => sw.accumulated + (sw.running ? Math.max(0, now - sw.startedAt) : 0)
export const cdTotal = (cd: TimerState['cd']) => cd.minutes[cd.preset] * 60000
export const cdRemaining = (cd: TimerState['cd'], now: number) => (cd.status === 'running' ? Math.max(0, cd.endAt - now) : cd.remainingMs)

export const timer = {
  setTab: (tab: TimerState['tab']) => commit({ ...state, tab }),
  swStart() { if (!state.sw.running) commit({ ...state, sw: { ...state.sw, running: true, startedAt: Date.now() } }) },
  swPause() { if (state.sw.running) commit({ ...state, sw: { ...state.sw, running: false, startedAt: 0, accumulated: swElapsed(state.sw, Date.now()) } }) },
  swReset: () => commit({ ...state, sw: defaults().sw }),
  swLap() {
    const { sw } = state
    if (!sw.running || sw.laps.length >= MAX_LAPS) return
    const total = swElapsed(sw, Date.now())
    const prev = sw.laps.length ? sw.laps[sw.laps.length - 1].total : 0
    commit({ ...state, sw: { ...sw, laps: [...sw.laps, { n: sw.laps.length + 1, split: Math.max(0, total - prev), total }] } })
  },
  cdStart() {
    const { cd } = state; const now = Date.now()
    if (cd.status === 'running') return
    const ms = cd.status === 'paused' ? cd.remainingMs : cdTotal(cd)
    commit({ ...state, cd: { ...cd, status: 'running', endAt: now + ms, remainingMs: ms, unseen: false } })
  },
  cdPause() {
    const { cd } = state
    if (cd.status === 'running') commit({ ...state, cd: { ...cd, status: 'paused', remainingMs: Math.max(0, cd.endAt - Date.now()), endAt: 0 } })
  },
  cdReset: () => commit({ ...state, cd: { ...state.cd, status: 'idle', endAt: 0, remainingMs: cdTotal(state.cd), unseen: false } }),
  cdSelect(preset: Preset) {
    if (state.cd.status === 'running') return
    commit({ ...state, cd: { ...state.cd, preset, status: 'idle', endAt: 0, remainingMs: state.cd.minutes[preset] * 60000, unseen: false } })
  },
  cdSetMinutes(m: number) {
    const { cd } = state
    if (cd.status === 'running' || cd.status === 'paused' || !Number.isFinite(m)) return
    const minutes = { ...cd.minutes, [cd.preset]: Math.round(Math.min(MAX_M, Math.max(MIN_M, m))) }
    commit({ ...state, cd: { ...cd, minutes, status: 'idle', endAt: 0, remainingMs: minutes[cd.preset] * 60000, unseen: false } })
  },
  dismiss() { if (state.cd.unseen) commit({ ...state, cd: { ...state.cd, unseen: false } }) },
}
export const TIMER_LIMITS = { MIN_M, MAX_M }
