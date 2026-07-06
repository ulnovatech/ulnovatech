import { useEffect, useRef, useState } from 'react'

/**
 * Hero typing animation:
 * - Phase 1: types "BUILDING " + (green) "TECH" + "THAT WORK — YOUR WAY." letter by letter
 * - Phase 2: only the accent word slot changes (APPS, WEBSITES, …) — static text stays fixed
 * - Full loop repeats
 */
export default function HeroTypedText() {
  const prefixRef = useRef(null)
  const swapRef = useRef(null)
  const suffixRef = useRef(null)
  const timers = useRef([])
  const runId = useRef(0)

  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    if (!prefixRef.current || !swapRef.current || !suffixRef.current) return

    const greenColor = 'green'
    const accentColor = '#ff4a17'

    const swapWords = ['APPS', 'WEBSITES', 'GRAPHICS', 'SOFTWARE']
    const phase1Text = ['BUILDING', 'TECH', 'THAT WORK — YOUR WAY.']
    const swapSlotWidth = `${Math.max('TECH'.length, ...swapWords.map((w) => w.length))}ch`

    function clearTimers() {
      timers.current.forEach((t) => clearTimeout(t))
      timers.current = []
    }

    function schedule(fn, ms) {
      const id = setTimeout(fn, ms)
      timers.current.push(id)
      return id
    }

    function resetSlots() {
      prefixRef.current.textContent = ''
      swapRef.current.textContent = ''
      suffixRef.current.textContent = ''
      swapRef.current.style.color = greenColor
      swapRef.current.style.minWidth = ''
    }

    function typePhase1(callback) {
      resetSlots()
      let partIndex = 0
      let charIndex = 0
      const localRun = runId.current

      const targets = [prefixRef.current, swapRef.current, suffixRef.current]

      function typeChar() {
        if (runId.current !== localRun) return

        if (partIndex >= phase1Text.length) {
          schedule(callback, 1000)
          return
        }

        const part = phase1Text[partIndex]
        const target = targets[partIndex]

        target.textContent += part[charIndex]

        charIndex++
        if (charIndex >= part.length) {
          partIndex++
          charIndex = 0
        }

        schedule(typeChar, 60)
      }

      typeChar()
    }

    function animateSwaps(index = 0, callback) {
      const localRun = runId.current
      const wordSpan = swapRef.current

      if (index >= swapWords.length) {
        callback?.()
        return
      }

      if (!wordSpan) {
        callback?.()
        return
      }

      wordSpan.style.minWidth = swapSlotWidth
      wordSpan.style.color = accentColor
      const word = swapWords[index]
      let j = 0
      wordSpan.textContent = ''

      function typeLetter() {
        if (runId.current !== localRun) return

        if (j < word.length) {
          wordSpan.textContent += word[j]
          j++
          schedule(typeLetter, 100)
        } else {
          schedule(deleteWord, 1500)
        }
      }

      function deleteWord() {
        if (runId.current !== localRun) return

        if (j > 0) {
          wordSpan.textContent = wordSpan.textContent.slice(0, -1)
          j--
          schedule(deleteWord, 50)
        } else {
          animateSwaps(index + 1, callback)
        }
      }

      typeLetter()
    }

    function loop() {
      typePhase1(() => {
        animateSwaps(0, () => {
          loop()
        })
      })
    }

    clearTimers()
    runId.current += 1
    loop()

    return () => {
      clearTimers()
      runId.current += 1
    }
  }, [ready])

  return (
    <span
      id="animated-sentence"
      className="block text-balance text-center text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl"
      aria-label="Building tech that works — your way"
    >
      <span className="inline-flex flex-col items-center">
        <span className="inline-flex items-baseline justify-center gap-x-2 sm:gap-x-3">
          <span ref={prefixRef} />
          <span
            ref={swapRef}
            className="inline-block text-left"
            style={{ verticalAlign: 'baseline' }}
          />
        </span>
        <span ref={suffixRef} className="mt-2 block sm:mt-3" />
      </span>
    </span>
  )
}
