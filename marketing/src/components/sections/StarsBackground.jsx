import { useEffect, useMemo, useState } from 'react'

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const apply = () => setReduced(Boolean(mq.matches))
    apply()
    mq.addEventListener?.('change', apply)
    return () => mq.removeEventListener?.('change', apply)
  }, [])

  return reduced
}

export default function StarsBackground({ count = 140, className = '' }) {
  const reduceMotion = usePrefersReducedMotion()

  const stars = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const left = Math.random() * 100
      const top = Math.random() * 100
      const size = Math.random() * 2 + 1
      const twinkle = Math.random() * 2 + 1.2
      const delay = Math.random() * 2.5
      return { i, left, top, size, twinkle, delay }
    })
  }, [count])

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s.i}
          className={reduceMotion ? 'absolute rounded-full bg-white/60' : 'portfolio-star'}
          style={
            reduceMotion
              ? {
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                }
              : {
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  animationDuration: `${s.twinkle}s`,
                  animationDelay: `${s.delay}s`,
                }
          }
        />
      ))}
    </div>
  )
}

