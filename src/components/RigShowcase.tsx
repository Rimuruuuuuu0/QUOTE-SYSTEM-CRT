import { useEffect, useRef, useState } from 'react'

// Layered-CSS 3D gaming setup: mouse parallax, slow RGB, click toggles lights.
// Gentle by design: small angles, slow loops, honors reduced motion.
export default function RigShowcase() {
  const [rgb, setRgb] = useState(() => {
    try {
      return localStorage.getItem('crt-rgb') !== 'off'
    } catch {
      return true
    }
  })
  const stage = useRef<HTMLDivElement>(null)
  const target = useRef({ x: 0, y: 0 })
  const cur = useRef({ x: 0, y: 0 })

  useEffect(() => {
    let raf = 0
    const tick = () => {
      cur.current.x += (target.current.x - cur.current.x) * 0.08
      cur.current.y += (target.current.y - cur.current.y) * 0.08
      if (stage.current) {
        stage.current.style.transform = `rotateX(${-cur.current.y}deg) rotateY(${cur.current.x}deg)`
      }
      raf = requestAnimationFrame(tick)
    }
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const flip = () => {
    setRgb((v) => {
      try {
        localStorage.setItem('crt-rgb', v ? 'off' : 'on')
      } catch {}
      return !v
    })
  }

  return (
    <div
      className="rig-stage select-none"
      onMouseMove={(e) => {
        const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
        target.current = {
          x: ((e.clientX - r.left) / r.width - 0.5) * 14,
          y: ((e.clientY - r.top) / r.height - 0.5) * 10,
        }
      }}
      onMouseLeave={() => (target.current = { x: 0, y: 0 })}
      onClick={flip}
      title={rgb ? 'Click to dim the RGB' : 'Click to light the RGB'}
    >
      <div ref={stage} className="rig-scene">
        <div className="rig-shadow" />
        <div className="rig-desk" />
        {/* monitor */}
        <div className="rig-monitor">
          <div className={`rig-screen ${rgb ? '' : 'rig-dim'}`} />
          <div className="rig-stand" />
        </div>
        {/* tower */}
        <div className="rig-tower">
          <div className="rig-led" style={{ opacity: rgb ? undefined : 0.15 }} />
          <div className="rig-glass">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`rig-fan ${rgb ? '' : 'rig-paused'}`}>
                <div className="rig-hub" />
              </div>
            ))}
          </div>
        </div>
        {/* keyboard */}
        <div className="rig-kb">{Array.from({ length: 14 }).map((_, i) => <span key={i} />)}</div>
      </div>
    </div>
  )
}
