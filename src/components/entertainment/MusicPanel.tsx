import { useState } from 'react'
import { ListMusic, Music2, Pause, Play, Plus, SkipBack, SkipForward, Square, Trash2, Volume2 } from 'lucide-react'
import { CATEGORIES, parseYouTube, play, removeItem, saveItem, setVolume, skip, stop, togglePlay, useYouTube } from '../../services/youtubeService'
import type { Category, SavedItem, Source } from '../../services/youtubeService'

const field = 'glass-chip min-h-10 min-w-0 rounded-full px-3 text-sm outline-none placeholder:text-[#2f4a35]/60'
const STATUS = { idle: '', loading: 'Loading…', playing: 'Playing', paused: 'Paused', buffering: 'Buffering…', ended: 'Ended', error: '' } as const
const isSame = (a: Source | null, b: Source) => !!a && a.kind === b.kind && a.ref === b.ref

export function MusicPanel() {
  const y = useYouTube()
  const [url, setUrl] = useState(''); const [label, setLabel] = useState('')
  const [cat, setCat] = useState<Category>('lofi'); const [err, setErr] = useState('')
  const [filter, setFilter] = useState<Category | 'all'>('all')

  const parse = () => { const s = parseYouTube(url); setErr(s ? '' : "That doesn't look like a YouTube video or playlist link."); return s }
  const onPlay = () => { const s = parse(); if (s) void play(s) }
  const onSave = () => { const s = parse(); if (!s) return; saveItem(s, label, cat); setUrl(''); setLabel('') }

  const cats = [...new Set(y.library.map(l => l.category))]
  const shown = y.library.filter(l => filter === 'all' || l.category === filter)
  const lastItem = y.last && !y.current ? y.library.find(l => isSame(y.last, l)) : undefined
  const playing = y.status === 'playing' || y.status === 'buffering'

  const row = (l: SavedItem) => {
    const on = isSame(y.current, l)
    return (
      <li key={l.id} className="flex items-center">
        <button className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl py-1 pl-1 text-left" aria-label={`Play ${l.label}`} aria-current={on ? 'true' : undefined} onClick={() => void play(l)}>
          {l.kind === 'playlist' ? <ListMusic size={16} strokeWidth={1.6} className="shrink-0" /> : <Music2 size={16} strokeWidth={1.6} className="shrink-0" />}
          <span className="min-w-0 flex-1"><span className="block truncate text-sm">{l.label}</span>
            <span className="block text-[11px] opacity-65">{l.kind === 'playlist' ? 'Playlist' : 'Video'} · {CATEGORIES[l.category]}{on ? ' · Now playing' : ''}</span></span>
        </button>
        <button className="icon-btn shrink-0" aria-label={`Remove ${l.label}`} onClick={() => removeItem(l.id)}><Trash2 size={16} strokeWidth={1.6} /></button>
      </li>
    )
  }

  return (
    <div>
      <div className="glass-chip flex items-center rounded-full pl-4 pr-1">
        <input value={url} aria-label="YouTube link" placeholder="Paste a YouTube link…" maxLength={300} onChange={e => { setUrl(e.target.value); setErr('') }}
          onKeyDown={e => { if (e.key === 'Enter') onPlay() }} className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#2f4a35]/60" />
        <button className="icon-btn" aria-label="Play link" onClick={onPlay}><Play size={17} strokeWidth={1.8} /></button>
      </div>
      <div className="mt-1.5 flex gap-1.5">
        <input value={label} aria-label="Name (optional)" placeholder="Name" maxLength={60} onChange={e => setLabel(e.target.value)} className={`${field} flex-1`} />
        <select value={cat} aria-label="Category" onChange={e => setCat(e.target.value as Category)} className={`${field} w-28`}>
          {(Object.keys(CATEGORIES) as Category[]).map(k => <option key={k} value={k}>{CATEGORIES[k]}</option>)}
        </select>
        <button className="glass-chip flex min-h-10 items-center gap-1 rounded-full px-3 text-sm" onClick={onSave} aria-label="Save link"><Plus size={15} />Save</button>
      </div>
      {err && <p role="alert" className="mt-1.5 px-1 text-xs">{err}</p>}

      {(y.current || lastItem || y.last) && (
        <section aria-label="Now playing" className="mt-3">
          {y.current ? (
            <>
              <p className="truncate px-1 text-sm" title={y.title}>{y.title || (y.current.kind === 'playlist' ? 'YouTube playlist' : 'YouTube video')}</p>
              <p className="px-1 text-xs opacity-70" aria-live="polite">{y.status === 'error' ? '' : STATUS[y.status]}{y.count > 1 ? ` · ${y.index} of ${y.count}` : ''}</p>
              {y.status === 'error' && <p role="alert" className="px-1 text-xs">{y.error}</p>}
              <div className="mt-1.5 flex items-center gap-1">
                {y.current.kind === 'playlist' && <button className="icon-btn" aria-label="Previous track" onClick={() => skip(-1)}><SkipBack size={16} /></button>}
                <button className="icon-btn glass-active" aria-label={playing ? 'Pause' : 'Play'} disabled={y.status === 'error'} onClick={togglePlay}>{playing ? <Pause size={17} /> : <Play size={17} />}</button>
                {y.current.kind === 'playlist' && <button className="icon-btn" aria-label="Next track" onClick={() => skip(1)}><SkipForward size={16} /></button>}
                <Volume2 size={16} strokeWidth={1.6} className="ml-1 shrink-0 opacity-75" aria-hidden="true" />
                <input type="range" min={0} max={100} value={y.volume} aria-label="Volume" onChange={e => setVolume(+e.target.value)} className="h-8 min-w-0 flex-1 accent-[#2f4a35]" />
                <button className="icon-btn" aria-label="Stop and close player" onClick={stop}><Square size={15} /></button>
              </div>
              <p className="px-1 text-[11px] opacity-60">Volume may be controlled by your device on iPad and iPhone.</p>
            </>
          ) : (
            <div className="flex items-center gap-2 px-1">
              <span className="min-w-0 flex-1 truncate text-sm">Last played: {lastItem?.label ?? (y.last?.kind === 'playlist' ? 'YouTube playlist' : 'YouTube video')}</span>
              <button className="glass-chip flex min-h-10 items-center gap-1 rounded-full px-3 text-sm" onClick={togglePlay}><Play size={15} />Resume</button>
            </div>
          )}
        </section>
      )}

      <div className="mt-3 flex items-center justify-between px-1">
        <h3 className="text-xs uppercase tracking-widest opacity-70">Saved · {y.library.length}</h3>
        {cats.length > 1 && (
          <select value={filter} aria-label="Filter by category" onChange={e => setFilter(e.target.value as Category | 'all')} className="glass-chip min-h-8 rounded-full px-2 text-xs outline-none">
            <option value="all">All</option>{cats.map(k => <option key={k} value={k}>{CATEGORIES[k]}</option>)}
          </select>
        )}
      </div>
      {y.library.length === 0
        ? <p className="px-1 py-3 text-center text-sm opacity-75">No saved links yet.<br />Paste a link you trust, then press Save.</p>
        : <ul className="mt-1 max-h-44 overflow-auto">{shown.map(row)}</ul>}
    </div>
  )
}
