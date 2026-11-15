import { AnimatePresence, motion } from 'framer-motion'
import { BellRing, X } from 'lucide-react'
import { PRESETS, timer } from '../../services/timerStore'
import type { TimerState } from '../../types'

/** Visual completion fallback; shown when a countdown ends while the timer panel is not open. */
export function TimerToast({ cd }: { cd: TimerState['cd'] }) {
  return (
    <AnimatePresence>
      {cd.unseen && (
        <motion.div key="t" role="status" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className="glass fixed left-[calc(1.25rem+var(--sal))] top-[calc(3.75rem+var(--sat))] z-40 flex max-w-[16rem] items-center gap-2 rounded-2xl py-1.5 pl-3 pr-1 text-sm text-[#2f4a35]">
          <BellRing size={16} strokeWidth={1.7} className="shrink-0" />
          <span>{PRESETS[cd.preset].label} complete</span>
          <button className="icon-btn shrink-0" aria-label="Dismiss notification" onClick={timer.dismiss}><X size={16} strokeWidth={1.7} /></button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
