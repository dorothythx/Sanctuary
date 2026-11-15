import { useEffect, useRef } from 'react'
import { registerHost, useYouTube } from '../../services/youtubeService'

/**
 * Always mounted at the app root, so the player survives panels opening and closing.
 * It stays visible (never hidden off-screen) while something is loaded, as YouTube's terms require.
 */
export function YouTubeHost() {
  const ref = useRef<HTMLDivElement>(null)
  const { current } = useYouTube()
  useEffect(() => { registerHost(ref.current); return () => registerHost(null) }, [])
  return <div ref={ref} className="yt-host" data-active={current ? 'true' : 'false'} role="region" aria-label="YouTube player" />
}
