import { useRef, useState } from 'react'
import { HiRefresh } from 'react-icons/hi'

const THRESHOLD = 72

export default function PullToRefresh({ onRefresh, refreshing, children }) {
  const startY = useRef(0)
  const pulling = useRef(false)
  const [pullDistance, setPullDistance] = useState(0)

  function onTouchStart(e) {
    if (window.scrollY > 0 || refreshing) return
    startY.current = e.touches[0].clientY
    pulling.current = true
  }

  function onTouchMove(e) {
    if (!pulling.current || refreshing) return
    const delta = e.touches[0].clientY - startY.current
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.5, THRESHOLD + 20))
    }
  }

  async function onTouchEnd() {
    if (!pulling.current) return
    pulling.current = false
    if (pullDistance >= THRESHOLD && onRefresh) {
      await onRefresh()
    }
    setPullDistance(0)
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: pullDistance > 0 || refreshing ? 40 : 0 }}
      >
        <HiRefresh
          className={`h-5 w-5 text-brand ${refreshing || pullDistance >= THRESHOLD ? 'animate-spin' : ''}`}
          style={{
            transform: `rotate(${Math.min(pullDistance / THRESHOLD, 1) * 180}deg)`,
          }}
        />
      </div>
      {children}
    </div>
  )
}
