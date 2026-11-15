import { memo } from 'react'
import type { Mode } from '../../types'
const MODES: { id: Mode; label: string }[] = [{ id: 'focus', label: 'Focus' }, { id: 'workspace', label: 'Workspace' }, { id: 'relax', label: 'Relax' }]
export const ModeSelector = memo(function ModeSelector({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div role="radiogroup" aria-label="Interface mode" className="glass relative flex gap-0.5 rounded-full p-1">
      {MODES.map(m => (
        <button key={m.id} role="radio" aria-checked={mode === m.id} onClick={() => onChange(m.id)}
          className={`min-h-10 rounded-full px-3.5 text-sm transition-colors ${mode === m.id ? 'glass-active' : 'glass-chip border-transparent'}`}>{m.label}</button>
      ))}
    </div>
  )
})
