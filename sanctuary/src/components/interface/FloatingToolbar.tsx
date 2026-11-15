import { memo } from 'react'
import { Cat, Flower2, ListChecks, Music, NotebookPen, Timer, type LucideIcon } from 'lucide-react'
import type { PanelId, ToolId } from '../../types'

export const TOOLS: Record<ToolId, { label: string; Icon: LucideIcon; blurb: string }> = {
  todo: { label: 'To-do list', Icon: ListChecks, blurb: 'Tasks and priorities will live here.' },
  stopwatch: { label: 'Stopwatch & timer', Icon: Timer, blurb: 'Stopwatch and focus timer will live here.' },
  notes: { label: 'Notes', Icon: NotebookPen, blurb: 'Quick notes will live here.' },
  music: { label: 'Music', Icon: Music, blurb: 'YouTube, local audio and ambient sounds will live here.' },
  garden: { label: 'Little garden', Icon: Flower2, blurb: 'A small garden to water and grow will live here.' },
  companion: { label: 'Companion', Icon: Cat, blurb: 'A small animal companion will live here.' },
}

interface Props { tools: ToolId[]; active: PanelId | null; onToggle: (id: PanelId) => void }
export const FloatingToolbar = memo(function FloatingToolbar({ tools, active, onToggle }: Props) {
  return (
    <nav aria-label="Tools" className="glass fixed bottom-[calc(1rem+var(--sab))] left-[calc(1rem+var(--sal))] z-20 flex gap-1 rounded-full p-1.5 tablet-portrait:left-1/2 tablet-portrait:-translate-x-1/2">
      {tools.map(id => {
        const { label, Icon } = TOOLS[id]
        return (
          <div key={id} className="group relative">
            <button className="icon-btn" aria-label={label} aria-pressed={active === id} aria-expanded={active === id} onClick={() => onToggle(id)}>
              <Icon size={20} strokeWidth={1.6} />
            </button>
            <span role="tooltip" className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#2f4a35] px-2 py-1 text-xs text-[#f6f1e4] opacity-0 transition-opacity group-hover:opacity-100 group-has-[:focus-visible]:opacity-100 group-has-[[aria-pressed=true]]:hidden">{label}</span>
          </div>
        )
      })}
    </nav>
  )
})
