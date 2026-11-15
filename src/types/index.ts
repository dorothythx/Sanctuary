export type ToolId = 'todo' | 'stopwatch' | 'notes' | 'music' | 'garden' | 'companion'
export type PanelId = ToolId | 'settings'
export type Mode = 'focus' | 'workspace' | 'relax'
export interface Pos { x: number; y: number }
export interface Scene { id: string; name: string; src: string; fallback: string }
export interface Settings {
  hour12: boolean; showDate: boolean; reducedMotion: boolean
  sceneId: string; mode: Mode; positions: Record<string, Pos>
}
export interface Task { id: string; text: string; done: boolean; createdAt: number }
export type Preset = 'focus' | 'short' | 'long'
export interface Lap { n: number; split: number; total: number }
export interface TimerState {
  tab: 'stopwatch' | 'focus'
  /** elapsed = accumulated + (running ? now - startedAt : 0) */
  sw: { running: boolean; startedAt: number; accumulated: number; laps: Lap[] }
  /** remaining = running ? endAt - now : remainingMs */
  cd: { preset: Preset; minutes: Record<Preset, number>; status: 'idle' | 'running' | 'paused' | 'finished'; endAt: number; remainingMs: number; unseen: boolean }
}
