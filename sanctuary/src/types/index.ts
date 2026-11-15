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
