import { SCENES } from '../environment/ParkScene'
import type { Settings } from '../../types'
interface Props { s: Settings; update: (p: Partial<Settings>) => void }
const seg = (on: boolean) => `min-h-10 flex-1 rounded-full px-3 text-sm transition-colors ${on ? 'glass-active' : 'glass-chip'}`
function Switch({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className="relative h-6 w-11 shrink-0 rounded-full transition-colors" style={{ background: on ? 'linear-gradient(180deg,#4c7454,#284430)' : 'rgba(47,74,53,.22)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,.12)' }}>
        <span className="absolute top-0.5 h-5 w-5 rounded-full bg-[#f6f1e4] transition-all" style={{ left: on ? '1.375rem' : '.125rem' }} />
      </button>
    </div>
  )
}
export function SettingsPanel({ s, update }: Props) {
  const pos = s.positions[s.sceneId] ?? { x: 50, y: 50 }
  const setPos = (p: Partial<typeof pos>) => update({ positions: { ...s.positions, [s.sceneId]: { ...pos, ...p } } })
  return (
    <div className="space-y-3">
      <div className="flex gap-1.5" role="group" aria-label="Clock format">
        <button className={seg(!s.hour12)} aria-pressed={!s.hour12} onClick={() => update({ hour12: false })}>24-hour</button>
        <button className={seg(s.hour12)} aria-pressed={s.hour12} onClick={() => update({ hour12: true })}>12-hour</button>
      </div>
      <div>
        <Switch label="Show date" on={s.showDate} onChange={v => update({ showDate: v })} />
        <Switch label="Reduce motion" on={s.reducedMotion} onChange={v => update({ reducedMotion: v })} />
      </div>
      <div role="group" aria-label="Scene" className="flex flex-col gap-1.5">
        <span className="text-sm">Scene</span>
        <div className="flex gap-1.5">{SCENES.map(sc => <button key={sc.id} className={`${seg(s.sceneId === sc.id)} px-1`} aria-pressed={s.sceneId === sc.id} onClick={() => update({ sceneId: sc.id })}>{sc.name}</button>)}</div>
      </div>
      <div role="group" aria-label="Image position" className="flex flex-col gap-1.5">
        <span className="text-sm">Image position</span>
        <div className="flex gap-1.5">
          {([['Top', 0], ['Center', 50], ['Bottom', 100]] as const).map(([l, y]) => <button key={l} className={seg(pos.y === y)} aria-pressed={pos.y === y} onClick={() => setPos({ y })}>{l}</button>)}
        </div>
        <label className="flex items-center gap-2 text-xs">Left–right<input type="range" min={0} max={100} value={pos.x} onChange={e => setPos({ x: +e.target.value })} className="h-8 flex-1 accent-[#2f4a35]" /></label>
        <label className="flex items-center gap-2 text-xs">Up–down<input type="range" min={0} max={100} value={pos.y} onChange={e => setPos({ y: +e.target.value })} className="h-8 flex-1 accent-[#2f4a35]" /></label>
        <p className="text-xs opacity-70">Position applies to photographs in public/parks/.</p>
      </div>
    </div>
  )
}
