import type { Mode, Settings, ToolId } from './types'
export const DEFAULTS: Settings = {
  hour12: false, showDate: true,
  reducedMotion: typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  sceneId: 'park-01', mode: 'workspace', positions: {},
}
export const MODE_TOOLS: Record<Mode, ToolId[]> = {
  focus: ['todo', 'stopwatch', 'music'],
  workspace: ['todo', 'stopwatch', 'notes', 'music'],
  relax: ['music', 'garden', 'companion'],
}
