import { memo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Pos, Scene } from '../../types'

const base = import.meta.env.BASE_URL
const trees = (a: string, b: string) =>
  `radial-gradient(ellipse 22% 30% at 14% 52%, ${a}, transparent 70%), radial-gradient(ellipse 26% 34% at 86% 48%, ${a}, transparent 70%), radial-gradient(ellipse 30% 14% at 50% 60%, ${b}, transparent 75%)`

/** Add files named park-XX.jpg/.png to public/parks/ to replace the gradient fallbacks. */
export const SCENES: Scene[] = [
  { id: 'park-01', name: 'Afternoon lawn', src: `${base}parks/park-01.png`,
    fallback: `radial-gradient(ellipse 50% 35% at 72% 24%, rgba(255,238,175,.8), transparent 65%), ${trees('rgba(52,92,52,.8)', 'rgba(120,160,100,.6)')}, linear-gradient(#cfe5ea 0%, #e8f0d8 40%, #9bbb82 58%, #5f8a4e 100%)` },
  { id: 'park-02', name: 'Garden path', src: `${base}parks/park-02.jpg`,
    fallback: `radial-gradient(ellipse 45% 30% at 30% 22%, rgba(255,250,215,.8), transparent 65%), ${trees('rgba(44,84,58,.8)', 'rgba(150,175,110,.55)')}, linear-gradient(#d8e8e2 0%, #eaf0dc 42%, #8db07a 60%, #4f7b4a 100%)` },
  { id: 'park-03', name: 'Golden hour', src: `${base}parks/park-03.jpg`,
    fallback: `radial-gradient(ellipse 55% 38% at 50% 40%, rgba(255,196,120,.85), transparent 65%), ${trees('rgba(60,86,48,.8)', 'rgba(170,170,100,.5)')}, linear-gradient(#f2c9a0 0%, #f6dfb8 40%, #a9b574 58%, #5d7a43 100%)` },
]

function Layer({ scene, pos }: { scene: Scene; pos: Pos }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  return (
    <motion.div className="absolute inset-0" style={{ background: scene.fallback }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.4, ease: 'easeInOut' }}>
      {!failed && (
        <img src={scene.src} alt="" draggable={false} onLoad={() => setLoaded(true)} onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          style={{ objectPosition: `${pos.x}% ${pos.y}%`, opacity: loaded ? 1 : 0 }} />
      )}
    </motion.div>
  )
}

export const ParkScene = memo(function ParkScene({ scene, pos }: { scene: Scene; pos: Pos }) {
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#6f9660]" aria-hidden="true">
      <AnimatePresence initial={false}><Layer key={scene.id} scene={scene} pos={pos} /></AnimatePresence>
      <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(20,40,20,.16), transparent 20%, transparent 72%, rgba(20,40,20,.24))' }} />
    </div>
  )
})
