import { useSyncExternalStore } from 'react'

/**
 * YouTube service: link parsing, saved library, and ONE persistent IFrame Player.
 * Lives outside React so playback survives panels closing, tool switches and mode changes.
 * Uses only the official IFrame Player API; no audio extraction, search or scraping.
 */
export type Kind = 'video' | 'playlist'
export interface Source { kind: Kind; ref: string }
export type Category = 'rain' | 'forest' | 'birds' | 'water' | 'lofi' | 'piano' | 'other'
export interface SavedItem extends Source { id: string; label: string; category: Category }
export type Status = 'idle' | 'loading' | 'playing' | 'paused' | 'buffering' | 'ended' | 'error'
export const CATEGORIES: Record<Category, string> = { rain: 'Rain', forest: 'Forest', birds: 'Birds & nature', water: 'Water', lofi: 'Lofi study', piano: 'Piano & instrumental', other: 'Other' }

export const KEY = 'sanctuary:youtube'
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/
const LIST_ID = /^[A-Za-z0-9_-]{13,64}$/
const HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com', 'youtu.be'])

/** Returns a safe {kind, ref} or null. If a link has a valid playlist id it is treated as a playlist. */
export function parseYouTube(input: string): Source | null {
  const text = input.trim()
  if (!text || text.length > 300) return null
  let u: URL
  try { u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`) } catch { return null }
  if ((u.protocol !== 'https:' && u.protocol !== 'http:') || !HOSTS.has(u.hostname.toLowerCase())) return null
  const list = u.searchParams.get('list')
  if (list && LIST_ID.test(list) && !/^(RD|UL)/.test(list)) return { kind: 'playlist', ref: list } // auto-mixes can't be embedded
  const seg = u.pathname.split('/').filter(Boolean)
  let v: string | null | undefined = null
  if (u.hostname.toLowerCase() === 'youtu.be') v = seg[0]
  else if (seg[0] === 'watch') v = u.searchParams.get('v')
  else if (['embed', 'shorts', 'live', 'v'].includes(seg[0])) v = seg[1]
  return v && VIDEO_ID.test(v) ? { kind: 'video', ref: v } : null
}
export const canonicalUrl = (s: Source) => (s.kind === 'video' ? `https://www.youtube.com/watch?v=${s.ref}` : `https://www.youtube.com/playlist?list=${s.ref}`)
const valid = (s: Source) => (s.kind === 'video' ? VIDEO_ID.test(s.ref) : LIST_ID.test(s.ref))
const same = (a: Source | null, b: Source | null) => !!a && !!b && a.kind === b.kind && a.ref === b.ref

interface State {
  library: SavedItem[]; volume: number; last: Source | null
  current: Source | null; status: Status; error: string | null; title: string; index: number; count: number
}
function sanitize(raw: unknown): Pick<State, 'library' | 'volume' | 'last'> {
  const out: Pick<State, 'library' | 'volume' | 'last'> = { library: [], volume: 60, last: null }
  if (!raw || typeof raw !== 'object') return out
  const o = raw as Record<string, any>
  const src = (x: any): Source | null => (x && (x.kind === 'video' || x.kind === 'playlist') && typeof x.ref === 'string' && valid(x) ? { kind: x.kind, ref: x.ref } : null)
  if (Array.isArray(o.library)) o.library.slice(0, 200).forEach((x: any, i: number) => {
    const s = src(x); if (!s || out.library.some(l => same(l, s))) return
    out.library.push({ ...s, id: typeof x.id === 'string' && x.id ? x.id : `saved-${i}`, label: (typeof x.label === 'string' ? x.label.trim() : '').slice(0, 60) || (s.kind === 'playlist' ? 'YouTube playlist' : 'YouTube video'),
      category: typeof x.category === 'string' && x.category in CATEGORIES ? (x.category as Category) : 'other' })
  })
  if (typeof o.volume === 'number' && Number.isFinite(o.volume)) out.volume = Math.round(Math.min(100, Math.max(0, o.volume)))
  out.last = src(o.last)
  return out
}
function load() { try { const r = localStorage.getItem(KEY); return sanitize(r === null ? null : JSON.parse(r)) } catch { return sanitize(null) } }

// Nothing is loaded and nothing plays at startup; the API script is only fetched after the user presses play.
let state: State = { ...load(), current: null, status: 'idle', error: null, title: '', index: 0, count: 0 }
const listeners = new Set<() => void>()
function set(p: Partial<State>, persist = false) {
  state = { ...state, ...p }
  if (persist) try { localStorage.setItem(KEY, JSON.stringify({ library: state.library, volume: state.volume, last: state.last })) } catch { /* storage unavailable */ }
  listeners.forEach(l => l())
}
export function useYouTube() { return useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb) } }, () => state) }

/* ---------- saved library ---------- */
export function saveItem(s: Source, label: string, category: Category) {
  const known = state.current && same(state.current, s) && state.title ? state.title : ''
  const name = (label.trim() || known || (s.kind === 'playlist' ? 'YouTube playlist' : 'YouTube video')).slice(0, 60)
  const i = state.library.findIndex(l => same(l, s))
  const item: SavedItem = { ...s, id: i >= 0 ? state.library[i].id : Date.now().toString(36) + Math.random().toString(36).slice(2, 6), label: name, category }
  set({ library: i >= 0 ? state.library.map((l, k) => (k === i ? item : l)) : [...state.library, item] }, true)
}
export const removeItem = (id: string) => set({ library: state.library.filter(l => l.id !== id) }, true)

/* ---------- player ---------- */
const ERRORS: Record<number, string> = {
  2: "That link isn't a valid YouTube video or playlist.", 5: "Your browser couldn't play this video.", 100: 'This video was not found, or it is private.',
  101: "The owner doesn't allow this video to be played outside YouTube.", 150: "The owner doesn't allow this video to be played outside YouTube.",
}
let apiPromise: Promise<any> | null = null
function loadApi(): Promise<any> {
  if (apiPromise) return apiPromise
  apiPromise = new Promise((resolve, reject) => {
    if ((window as any).YT?.Player) return resolve((window as any).YT)
    const fail = () => { apiPromise = null; document.querySelector('script[data-yt-api]')?.remove(); reject(new Error('YouTube API unavailable')) }
    const timer = window.setTimeout(fail, 15000)
    const prev = (window as any).onYouTubeIframeAPIReady
    ;(window as any).onYouTubeIframeAPIReady = () => { window.clearTimeout(timer); prev?.(); resolve((window as any).YT) }
    if (!document.querySelector('script[data-yt-api]')) { // never inject the API script twice
      const s = document.createElement('script')
      s.src = 'https://www.youtube.com/iframe_api'; s.async = true; s.dataset.ytApi = '1'
      s.onerror = () => { window.clearTimeout(timer); fail() }
      document.head.appendChild(s)
    }
  })
  return apiPromise
}

let player: any = null, host: HTMLElement | null = null, pending: Source | null = null, seq = 0
export const registerHost = (el: HTMLElement | null) => { host = el }
const startOn = (s: Source) => (s.kind === 'video' ? player.loadVideoById(s.ref) : player.loadPlaylist({ listType: 'playlist', list: s.ref }))

function refreshInfo() {
  try {
    const d = player?.getVideoData?.()
    const list = state.current?.kind === 'playlist' ? player?.getPlaylist?.() : null
    set({ title: d?.title || state.title, index: list ? (player.getPlaylistIndex?.() ?? 0) + 1 : 0, count: list ? list.length : 0 })
  } catch { /* info is optional */ }
}
function onState(e: { data: number }) {
  const map: Record<number, Status> = { [-1]: 'loading', 0: 'ended', 1: 'playing', 2: 'paused', 3: 'buffering', 5: 'paused' }
  if (map[e.data]) set({ status: map[e.data], error: null })
  refreshInfo()
}
const onError = (e: { data: number }) => set({ status: 'error', error: ERRORS[e.data] ?? "This video can't be played." })

/** Must be called from a user gesture (click/tap) so browsers permit audio. */
export async function play(s: Source) {
  const my = ++seq
  set({ current: s, last: s, status: 'loading', error: null, title: '', index: 0, count: 0 }, true)
  try {
    const YT = await loadApi()
    if (my !== seq) return
    if (player) { if (typeof player.loadVideoById === 'function') startOn(s); else pending = s; return }
    if (!host) throw new Error('no host')
    const mount = document.createElement('div'); mount.style.cssText = 'width:100%;height:100%'; host.appendChild(mount)
    player = new YT.Player(mount, {
      width: '100%', height: '100%', ...(s.kind === 'video' ? { videoId: s.ref } : {}),
      playerVars: { autoplay: 1, playsinline: 1, rel: 0, origin: location.origin, ...(s.kind === 'playlist' ? { listType: 'playlist', list: s.ref } : {}) },
      events: { onReady: () => { try { player.setVolume(state.volume) } catch { /* */ } if (pending) { startOn(pending); pending = null } }, onStateChange: onState, onError },
    })
  } catch { if (my === seq) set({ status: 'error', error: "Couldn't load the YouTube player. Check your connection or content blocker, then try again." }) }
}
export function togglePlay() {
  if (!state.current) { if (state.last) void play(state.last); return }
  if (!player || typeof player.playVideo !== 'function') return
  if (state.status === 'playing' || state.status === 'buffering') player.pauseVideo(); else player.playVideo()
}
export const skip = (dir: 1 | -1) => { try { dir === 1 ? player?.nextVideo() : player?.previousVideo() } catch { /* */ } }
export function setVolume(v: number) {
  const n = Math.round(Math.min(100, Math.max(0, v)))
  try { player?.setVolume?.(n) } catch { /* */ }
  set({ volume: n }, true)
}
export function stop() {
  seq++; pending = null
  try { player?.destroy?.() } catch { /* */ }
  player = null; host?.replaceChildren()
  set({ current: null, status: 'idle', error: null, title: '', index: 0, count: 0 })
}
export const isActive = (s: State) => !!s.current && (s.status === 'playing' || s.status === 'buffering')
