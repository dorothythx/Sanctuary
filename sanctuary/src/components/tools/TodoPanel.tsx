import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Leaf, Plus, Trash2 } from 'lucide-react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import type { Task } from '../../types'

const MAX_LEN = 200
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

/** Accept only well-formed tasks from storage; anything else is dropped. */
function sanitize(raw: unknown): Task[] {
  if (!Array.isArray(raw)) return []
  const out: Task[] = []
  raw.forEach((t, i) => {
    if (!t || typeof t !== 'object') return
    const o = t as Record<string, unknown>
    if (typeof o.text !== 'string' || !o.text.trim()) return
    out.push({
      id: typeof o.id === 'string' ? o.id : `restored-${i}`,
      text: o.text.slice(0, MAX_LEN), done: o.done === true,
      createdAt: typeof o.createdAt === 'number' ? o.createdAt : 0,
    })
  })
  return out
}

export function TodoPanel() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('sanctuary:todos', [], sanitize)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus the input on desktop only; on touch devices it would pop the keyboard open uninvited.
  useEffect(() => { if (window.matchMedia('(pointer: fine)').matches) inputRef.current?.focus() }, [])

  const active = tasks.filter(t => !t.done)
  const done = tasks.filter(t => t.done)

  const add = () => {
    const text = draft.trim()
    if (!text) return
    setTasks(p => [...p, { id: newId(), text, done: false, createdAt: Date.now() }])
    setDraft('')
  }
  const toggle = (id: string) => setTasks(p => p.map(t => (t.id === id ? { ...t, done: !t.done } : t)))
  const remove = (id: string) => setTasks(p => p.filter(t => t.id !== id))
  const commit = () => {
    const text = editText.trim()
    if (editing && text) setTasks(p => p.map(t => (t.id === editing ? { ...t, text } : t)))
    setEditing(null)
  }

  const row = (t: Task) => (
    <motion.li key={t.id} layout="position" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex items-center">
      <button role="checkbox" aria-checked={t.done} aria-label={`${t.done ? 'Mark as not done' : 'Mark as done'}: ${t.text}`} onClick={() => toggle(t.id)} className="icon-btn shrink-0">
        <span className={`grid h-5 w-5 place-items-center rounded-full border border-[#2f4a35]/60 transition-colors ${t.done ? 'bg-[#2f4a35] text-[#f6f1e4]' : 'bg-white/40'}`}>{t.done && <Check size={13} strokeWidth={2.5} />}</span>
      </button>
      {editing === t.id ? (
        <input autoFocus value={editText} maxLength={MAX_LEN} aria-label="Edit task" onChange={e => setEditText(e.target.value)} onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { e.stopPropagation(); setEditing(null) } }}
          className="glass-chip min-h-10 min-w-0 flex-1 rounded-full px-3 text-sm outline-none" />
      ) : (
        <button aria-label={`Edit task: ${t.text}`} onClick={() => { setEditing(t.id); setEditText(t.text) }}
          className={`min-h-11 min-w-0 flex-1 break-words py-1 text-left text-sm leading-snug ${t.done ? 'line-through opacity-60' : ''}`}>{t.text}</button>
      )}
      <button className="icon-btn shrink-0" aria-label={`Delete task: ${t.text}`} onClick={() => remove(t.id)}><Trash2 size={16} strokeWidth={1.6} /></button>
    </motion.li>
  )

  return (
    <div>
      <div className="glass-chip flex items-center rounded-full pl-4 pr-1">
        <input ref={inputRef} value={draft} maxLength={MAX_LEN} aria-label="New task" placeholder="Add a task…" onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') add() }} className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#2f4a35]/60" />
        <button className="icon-btn" aria-label="Add task" onClick={add}><Plus size={18} strokeWidth={1.8} /></button>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center text-sm opacity-75">
          <Leaf size={22} strokeWidth={1.4} />
          <p>Nothing to do yet.<br />Add a task above, or simply enjoy the park.</p>
        </div>
      ) : (
        <>
          <ul className="mt-2"><AnimatePresence initial={false}>{active.map(row)}</AnimatePresence></ul>
          {done.length > 0 && (
            <>
              <h3 className="mt-2 px-1 text-xs uppercase tracking-widest opacity-70">Completed · {done.length}</h3>
              <ul><AnimatePresence initial={false}>{done.map(row)}</AnimatePresence></ul>
            </>
          )}
          <div className="mt-2 flex items-center justify-between gap-2 px-1 text-xs">
            <span aria-live="polite">{active.length} {active.length === 1 ? 'task' : 'tasks'} remaining</span>
            {done.length > 0 && <button className="glass-chip min-h-9 rounded-full px-3" onClick={() => setTasks(p => p.filter(t => !t.done))}>Clear completed</button>}
          </div>
        </>
      )}
    </div>
  )
}
