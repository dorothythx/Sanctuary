import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
interface Props { title: string; anchor?: 'left' | 'right'; onClose: () => void; children: ReactNode }
export function ExpandablePanel({ title, anchor = 'left', onClose, children }: Props) {
  return (
    <motion.section role="dialog" aria-label={title} className={`glass panel panel-${anchor}`}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
      <header className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-2xl font-medium">{title}</h2>
        <button className="icon-btn -mr-2" aria-label={`Close ${title}`} onClick={onClose}><X size={18} strokeWidth={1.6} /></button>
      </header>
      {children}
    </motion.section>
  )
}
