import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { Leaf, Settings as Cog } from 'lucide-react'
import { ParkScene, SCENES } from './components/environment/ParkScene'
import { ClockWidget } from './components/interface/ClockWidget'
import { ExpandablePanel } from './components/interface/ExpandablePanel'
import { FloatingToolbar, TOOLS } from './components/interface/FloatingToolbar'
import { ModeSelector } from './components/interface/ModeSelector'
import { SettingsPanel } from './components/interface/SettingsPanel'
import { TodoPanel } from './components/tools/TodoPanel'
import { TimerPanel } from './components/tools/TimerPanel'
import { TimerToast } from './components/tools/TimerToast'
import { useTimerEngine, useTimerState } from './services/timerStore'
import { useLocalStorage } from './hooks/useLocalStorage'
import { DEFAULTS, MODE_TOOLS } from './constants'
import type { Mode, PanelId, Settings } from './types'

export default function App() {
  const [stored, setStored] = useLocalStorage<Settings>('sanctuary:settings', DEFAULTS)
  const s: Settings = { ...DEFAULTS, ...stored }
  const update = useCallback((p: Partial<Settings>) => setStored(prev => ({ ...DEFAULTS, ...prev, ...p })), [setStored])
  const setMode = useCallback((mode: Mode) => update({ mode }), [update])
  useTimerEngine()
  const timerState = useTimerState()
  const [active, setActive] = useState<PanelId | null>(null)
  const toggle = useCallback((id: PanelId) => setActive(a => (a === id ? null : id)), [])
  const tools = MODE_TOOLS[s.mode]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActive(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => { if (active && active !== 'settings' && !tools.includes(active)) setActive(null) }, [tools, active])

  const scene = SCENES.find(x => x.id === s.sceneId) ?? SCENES[0]
  const pos = s.positions[scene.id] ?? { x: 50, y: 50 }

  return (
    <MotionConfig reducedMotion={s.reducedMotion ? 'always' : 'user'}>
      <div className={s.reducedMotion ? 'reduce-motion' : ''}>
        <ParkScene scene={scene} pos={pos} />
        <AnimatePresence>
          {s.mode !== 'focus' && (
            <motion.div key="id" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed left-[calc(1.25rem+var(--sal))] top-[calc(1.25rem+var(--sat))] z-10 flex items-center gap-2 text-[#fbf8ef] [text-shadow:0_1px_10px_rgba(20,40,20,.5)]">
              <Leaf size={20} strokeWidth={1.5} /><span className="font-display text-2xl">Sanctuary</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="fixed right-[calc(1rem+var(--sar))] top-[calc(1rem+var(--sat))] z-20 flex items-center gap-2">
          <ModeSelector mode={s.mode} onChange={setMode} />
          <div className="glass rounded-full p-1">
            <button className="icon-btn" aria-label="Settings" aria-pressed={active === 'settings'} onClick={() => toggle('settings')}><Cog size={20} strokeWidth={1.6} /></button>
          </div>
        </div>
        <FloatingToolbar tools={tools} active={active} onToggle={toggle} busy={timerState.sw.running || timerState.cd.status === 'running' ? ['stopwatch'] : []} />
        <TimerToast cd={timerState.cd} />
        <div className="fixed bottom-[calc(1.25rem+var(--sab))] right-[calc(1.5rem+var(--sar))] z-10 tablet-portrait:bottom-auto tablet-portrait:right-1/2 tablet-portrait:top-[calc(4.5rem+var(--sat))] tablet-portrait:translate-x-1/2">
          <ClockWidget hour12={s.hour12} showDate={s.showDate} />
        </div>
        <AnimatePresence mode="wait">
          {active === 'settings' && <ExpandablePanel key="settings" title="Settings" anchor="right" onClose={() => setActive(null)}><SettingsPanel s={s} update={update} /></ExpandablePanel>}
          {active && active !== 'settings' && (
            <ExpandablePanel key={active} title={TOOLS[active].label} onClose={() => setActive(null)}>
              {active === 'todo' ? <TodoPanel /> : active === 'stopwatch' ? <TimerPanel /> : <p className="text-sm leading-relaxed opacity-80">{TOOLS[active].blurb} Coming in a later phase.</p>}
            </ExpandablePanel>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}
