import { useEffect, useState } from 'react'
export function useLocalStorage<T>(key: string, initial: T, sanitize?: (raw: unknown) => T) {
  const [value, setValue] = useState<T>(() => {
    try { const raw = localStorage.getItem(key); if (raw === null) return initial; const parsed: unknown = JSON.parse(raw); return sanitize ? sanitize(parsed) : (parsed as T) } catch { return initial }
  })
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage full or blocked */ } }, [key, value])
  return [value, setValue] as const
}
