import { useEffect, useRef, useState } from 'react'

// Battlestation diorama inspired by classic RGB setups: wooden desk, neon-ring
// monitor with desktop + taskbar, glowing speakers, glass tower (fans, cooler,
// RGB RAM, GPU), wave keyboard, mouse + pad. Gentle motion, click dims lights.
const ROWS = [14, 14, 13, 12]

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
          x: ((e.clientX - r.left) / r.width - 0.5) * 12,
          y: ((e.clientY - r.top) / r.height - 0.5) * 8,
        }
      }}
      onMouseLeave={() => (target.current = { x: 0, y: 0 })}
      onClick={flip}
      title={rgb ? 'Click to dim the RGB' : 'Click to light the RGB'}
    >
      <div ref={stage} className={`rig2 ${rgb ? '' : 'lights-off'}`}>
        <div className="rig2-wall" />
        <div className="rig2-desk" />
        {/* left speaker */}
        <div className="rig2-spk left">
          <div className="rgb ring big" />
          <div className="rgb ring small" />
        </div>
        {/* monitor */}
        <div className="rig2-mon">
          <div className="rig2-screen">
            <div className="rgb rig2-wallpaper" />
            <div className="rig2-icons">
              {Array.from({ length: 8 }).map((_, i) => (
                <i key={i} />
              ))}
            </div>
            <div className="rig2-taskbar">
              {Array.from({ length: 9 }).map((_, i) => (
                <i key={i} />
              ))}
            </div>
            <span className="rig2-brand">GIGABYTE</span>
          </div>
          <div className="rig2-neck" />
          <div className="rig2-base" />
        </div>
        {/* right speaker */}
        <div className="rig2-spk right">
          <div className="rgb ring big" />
          <div className="rgb ring small" />
        </div>
        {/* tower */}
        <div className="rig2-tower">
          <div className="rig2-side">
            <div className="rgb rig2-fan rear" />
            <div className="rig2-cooler">
              <div className="rgb rig2-fan mid" />
            </div>
            <div className="rig2-ram">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="rgb stick" style={{ animationDelay: `${i * 0.35}s` }} />
              ))}
            </div>
            <div className="rig2-gpu">
              <span className="rgb gpu-glow">ROG</span>
              <span className="gpu-brand">GALAX</span>
            </div>
            <div className="rig2-shroud"><span>MSI</span></div>
          </div>
          <div className="rig2-front">
            <div className="rgb rig2-fan big" />
            <div className="rgb rig2-fan big" />
            <div className="rig2-tiny" />
          </div>
        </div>
        {/* keyboard */}
        <div className="rig2-kb">
          {ROWS.map((n, r) => (
            <div key={r} className="row">
              {Array.from({ length: n }).map((_, i) => (
                <span key={i} className="rgb key" style={{ animationDelay: `${(r * 14 + i) * 0.09}s` }} />
              ))}
            </div>
          ))}
        </div>
        {/* mouse + pad */}
        <div className="rig2-pad" />
        <div className="rig2-mouse" />
      </div>
    </div>
  )
}
