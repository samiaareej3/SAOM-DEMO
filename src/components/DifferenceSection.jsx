  import { useEffect, useRef, useState } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const RED = '#e4002b'

// Each word in the two headline states gets a small "depth" value — it
// drives both a static translateZ (so the composition already has depth
// before anyone moves the cursor) and how strongly the word reacts when
// the cursor passes near it. Values are deliberately modest: this is a
// shallow, editorial 3D, not a scene.
const WORD_DEPTH = {
  a1: 0.3, // One
  a2: 0.55, // event
  a3: 0.3, // is
  a4: 0.6, // noise.
  b1: 0.35, // The
  b2: 0.7, // pattern (special)
  b3: 0.3, // is
  b4: 0.35, // the
  b5: 0.75, // threat. (signal)
}

const CURSOR_RADIUS = 260
const PATTERN_LETTERS = ['P', 'a', 't', 't', 'e', 'r', 'n']

export default function DifferenceSection() {
  const sectionRef = useRef(null)
  const wrapRef = useRef(null)
  const stageRef = useRef(null)

  const labelRef = useRef(null)

  const lineARef = useRef(null)
  const lineBRef = useRef(null)
  const wordRefs = useRef({})

  const patternRef = useRef(null)
  const patternMarkRefs = useRef([])
  const patternAnnotationRef = useRef(null)

  const threatRef = useRef(null)
  const threatAnnotationRef = useRef(null)
  const scanLineRef = useRef(null)
  const redPlaneRef = useRef(null)
  const frameRef = useRef(null)

  const bodyRef = useRef(null)
  const markerRef = useRef(null)
  const markerLineRef = useRef(null)

  // Backtracking device: the red vertical line is the investigation cursor.
  // It moves from right → left during scroll, revealing the hidden context
  // behind the headline.
  const backtrackLineRef = useRef(null)
  const backtrackTrailRef = useRef(null)
  const backtrackLabelsRef = useRef([])
  const originRef = useRef(null)
  const evidenceRefs = useRef([])
  const evidenceLineRefs = useRef([])
  const evidenceCardRef = useRef(null)
  const routePathRef = useRef(null)
  const routeGlowRef = useRef(null)
  const routeNodesRef = useRef([])
  const routeLabelsRef = useRef([])
  const routeStatusRef = useRef(null)

  const prefersReducedMotion = useReducedMotion()
  const [isCoarsePointer, setIsCoarsePointer] = useState(true)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 40, damping: 18, mass: 0.6 })
  const springY = useSpring(mouseY, { stiffness: 40, damping: 18, mass: 0.6 })

  const stageRotateX = useTransform(springY, [-1, 1], [3, -3])
  const stageRotateY = useTransform(springX, [-1, 1], [-4, 4])
  const frameRotateX = useTransform(springY, [-1, 1], [1.4, -1.4])
  const frameRotateY = useTransform(springX, [-1, 1], [-2.2, 2.2])
  // The red line is now scroll-driven rather than cursor-positioned.
  // Cursor movement still controls the shallow 3D typography.

  useEffect(() => {
    setIsCoarsePointer(window.matchMedia('(hover: none), (pointer: coarse)').matches)
  }, [])

  // --- static depth placement (once) ----------------------------------------
  useEffect(() => {
    Object.entries(WORD_DEPTH).forEach(([id, depth]) => {
      const el = wordRefs.current[id]
      if (el) gsap.set(el, { z: (depth - 0.5) * 70, transformPerspective: 900 })
    })
  }, [])

  // --- scroll choreography ---------------------------------------------------
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return undefined

    const ctx = gsap.context(() => {
      const aWords = ['a1', 'a2', 'a3', 'a4'].map((id) => wordRefs.current[id]).filter(Boolean)
      const bWords = ['b1', 'b3', 'b4'].map((id) => wordRefs.current[id]).filter(Boolean)
      const marks = patternMarkRefs.current.filter(Boolean)

      if (prefersReducedMotion) {
        gsap.set(lineARef.current, { autoAlpha: 0, display: 'none' })
        gsap.set(lineBRef.current, { autoAlpha: 1 })
        gsap.set([...bWords, patternRef.current, threatRef.current], { autoAlpha: 1, y: 0 })
        gsap.set(threatRef.current, { color: RED })
        gsap.set(labelRef.current, { autoAlpha: 1, y: 0 })
        gsap.set(bodyRef.current, { autoAlpha: 1, y: 0 })
        gsap.set(markerRef.current, { autoAlpha: 1, y: 0 })
        gsap.set(markerLineRef.current, { scaleX: 1 })
        gsap.set(backtrackLineRef.current, { autoAlpha: 1, left: '10%' })
        gsap.set(backtrackTrailRef.current, { autoAlpha: 0, left: '10%' })
        gsap.set(backtrackLabelsRef.current.filter(Boolean), { autoAlpha: 1, x: 0 })
        gsap.set(originRef.current, { autoAlpha: 1, scale: 1 })
        gsap.set(routePathRef.current, { strokeDashoffset: 0 })
        gsap.set(routeGlowRef.current, { strokeDashoffset: 0 })
        gsap.set(routeNodesRef.current.filter(Boolean), { autoAlpha: 1, scale: 1 })
        gsap.set(routeLabelsRef.current.filter(Boolean), { autoAlpha: 1, y: 0 })
        gsap.set(routeStatusRef.current, { autoAlpha: 1 })
        return
      }

      // initial states
      gsap.set(labelRef.current, { autoAlpha: 0, y: 10 })
      gsap.set(aWords, { autoAlpha: 0, y: 26, clipPath: 'inset(0 0 100% 0)' })
      gsap.set(lineARef.current, { autoAlpha: 1, y: 0, scale: 1, z: 0 })
      gsap.set(lineBRef.current, { autoAlpha: 0, y: 22, scale: 0.98, z: -30 })
      gsap.set([...bWords, patternRef.current, threatRef.current], {
        autoAlpha: 0,
        y: 18,
        clipPath: 'inset(0 0 100% 0)',
      })
      gsap.set(threatRef.current, { color: 'inherit' })
      gsap.set(marks, { autoAlpha: 0 })
      gsap.set(scanLineRef.current, { autoAlpha: 0, xPercent: -120 })
      gsap.set(redPlaneRef.current, { scaleY: 0, autoAlpha: 0.6 })
      gsap.set(bodyRef.current, { autoAlpha: 0, y: 10 })
      gsap.set(markerRef.current, { autoAlpha: 0, y: 12 })
      gsap.set(markerLineRef.current, { scaleX: 0 })

      // Backtracking system starts at the far right. The line itself is
      // deliberately sharp and minimal; its motion is the visual metaphor.
      gsap.set(backtrackLineRef.current, { autoAlpha: 1, left: '88%' })
      gsap.set(backtrackTrailRef.current, { autoAlpha: 0, left: '88%' })
      gsap.set(backtrackLabelsRef.current.filter(Boolean), {
        autoAlpha: 0,
        x: 18,
      })
      gsap.set(originRef.current, { autoAlpha: 0, scale: 0.6 })

      // Persistent forensic tracking route. The route is visible from the
      // beginning, then grows location-to-location as the user scrolls.
      // This makes the interaction readable while it is happening rather
      // than revealing the evidence only after the scroll is finished.
      const routeLength = routePathRef.current?.getTotalLength?.() || 1000
      gsap.set(routePathRef.current, {
        strokeDasharray: routeLength,
        strokeDashoffset: routeLength,
      })
      gsap.set(routeGlowRef.current, {
        strokeDasharray: routeLength,
        strokeDashoffset: routeLength,
        autoAlpha: 0.15,
      })
      gsap.set(routeNodesRef.current.filter(Boolean), {
        autoAlpha: 0.28,
        scale: 0.75,
        transformOrigin: 'center',
      })
      gsap.set(routeLabelsRef.current.filter(Boolean), {
        autoAlpha: 0.3,
        y: 4,
      })
      gsap.set(routeStatusRef.current, {
        autoAlpha: 0.6,
      })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 78%',
          end: 'bottom 40%',
          scrub: 0.6,
        },
      })

      // PHASE 1 — Arrival: the label, then "One event / is noise." unfolds.
      tl.to(labelRef.current, { autoAlpha: 1, y: 0, duration: 0.06 }, 0)
      tl.to(
        aWords,
        {
          autoAlpha: 1,
          y: 0,
          clipPath: 'inset(0 0 0% 0)',
          duration: 0.14,
          stagger: 0.05,
          ease: 'power3.out',
        },
        0.03
      )

      // PHASE 2 — Disruption: line A recedes into depth, line B assembles.
      tl.to(lineARef.current, { autoAlpha: 0, y: -22, z: -60, scale: 0.95, duration: 0.16 }, 0.22)
      tl.to(lineBRef.current, { autoAlpha: 1, y: 0, z: 0, scale: 1, duration: 0.18 }, 0.26)
      tl.to(
        bWords,
        { autoAlpha: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 0.14, stagger: 0.05, ease: 'power3.out' },
        0.28
      )
      tl.to(
        patternRef.current,
        { autoAlpha: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 0.14 },
        0.3
      )

      // The "discovering structure" moment — Pattern's letters breathe apart,
      // small technical marks surface between them, then it resettles.
      tl.to(patternRef.current, { letterSpacing: '0.15em', rotationY: 6, duration: 0.09, ease: 'power2.out' }, 0.34)
      tl.to(marks, { autoAlpha: 0.85, duration: 0.05, stagger: 0.015 }, 0.35)
      tl.to(marks, { autoAlpha: 0, duration: 0.06, stagger: 0.01 }, 0.41)
      tl.to(patternRef.current, { letterSpacing: '0em', rotationY: 0, duration: 0.09, ease: 'power2.inOut' }, 0.43)

      // PHASE 3 — Recognition: the full line settles forward, the plane
      // sweeps through, and "threat." takes the signal color.
      tl.to(lineBRef.current, { z: 16, scale: 1.02, duration: 0.14 }, 0.46)
      tl.to(redPlaneRef.current, { scaleY: 1, autoAlpha: 1, duration: 0.12, ease: 'power2.out' }, 0.48)
      tl.to(redPlaneRef.current, { autoAlpha: 0, duration: 0.14 }, 0.62)
      tl.to(
        threatRef.current,
        { autoAlpha: 1, y: 0, clipPath: 'inset(0 0 0% 0)', color: RED, duration: 0.14 },
        0.5
      )
      tl.to(scanLineRef.current, { autoAlpha: 0, duration: 0.04 }, 0.52)

      // ---------------------------------------------------------------
      // BACKTRACK — the red vertical line becomes the investigation
      // cursor. It deliberately travels RIGHT → LEFT. As it crosses the
      // composition, hidden forensic context is revealed behind it.
      // ---------------------------------------------------------------
      tl.to(backtrackLineRef.current, {
        left: '72%',
        duration: 0.16,
        ease: 'none',
      }, 0.52)
      tl.to(backtrackTrailRef.current, {
        autoAlpha: 0.22,
        left: '72%',
        duration: 0.16,
        ease: 'none',
      }, 0.52)

      tl.to(backtrackLabelsRef.current[0], {
        autoAlpha: 1,
        x: 0,
        duration: 0.07,
        ease: 'power2.out',
      }, 0.58)

      // A brief inspection pause.
      tl.to(backtrackLineRef.current, {
        left: '58%',
        duration: 0.13,
        ease: 'power2.inOut',
      }, 0.68)
      tl.to(backtrackTrailRef.current, {
        left: '58%',
        duration: 0.13,
        ease: 'power2.inOut',
      }, 0.68)
      tl.to(backtrackLabelsRef.current[1], {
        autoAlpha: 1,
        x: 0,
        duration: 0.07,
        ease: 'power2.out',
      }, 0.73)

      // The final pass is faster: the system has found the relevant
      // context and traces it back toward its origin.
      tl.to(backtrackLineRef.current, {
        left: '24%',
        duration: 0.18,
        ease: 'power1.inOut',
      }, 0.79)
      tl.to(backtrackTrailRef.current, {
        left: '24%',
        duration: 0.18,
        ease: 'power1.inOut',
      }, 0.79)
      tl.to(backtrackLabelsRef.current[2], {
        autoAlpha: 1,
        x: 0,
        duration: 0.07,
        ease: 'power2.out',
      }, 0.84)

      tl.to(backtrackLineRef.current, {
        left: '10%',
        duration: 0.1,
        ease: 'power2.out',
      }, 0.9)
      tl.to(backtrackTrailRef.current, {
        left: '10%',
        duration: 0.1,
        ease: 'power2.out',
      }, 0.9)
      tl.to(originRef.current, {
        autoAlpha: 1,
        scale: 1,
        duration: 0.08,
        ease: 'back.out(2)',
      }, 0.94)

      // ---------------------------------------------------------------
      // FORENSIC TRACK — the section behaves like a tracking screen.
      // The incident is traced backward from NETWORK → HOST → SESSION →
      // AUTH. The complete route remains visible while each segment is
      // progressively drawn.
      // ---------------------------------------------------------------
      

      tl.to(routeStatusRef.current, {
        autoAlpha: 1,
        duration: 0.05,
      }, 0.52)

      tl.to(routePathRef.current, {
        strokeDashoffset: routeLength * 0.75,
        duration: 0.12,
        ease: 'power2.inOut',
      }, 0.56)
      tl.to(routeGlowRef.current, {
        strokeDashoffset: routeLength * 0.75,
        duration: 0.12,
        ease: 'power2.inOut',
      }, 0.56)
      tl.to(routeNodesRef.current[0], {
        autoAlpha: 1,
        scale: 1,
        duration: 0.07,
      }, 0.58)
      tl.to(routeLabelsRef.current[0], {
        autoAlpha: 1,
        y: 0,
        duration: 0.06,
      }, 0.59)

      tl.to(routePathRef.current, {
        strokeDashoffset: routeLength * 0.5,
        duration: 0.13,
        ease: 'power2.inOut',
      }, 0.69)
      tl.to(routeGlowRef.current, {
        strokeDashoffset: routeLength * 0.5,
        duration: 0.13,
        ease: 'power2.inOut',
      }, 0.69)
      tl.to(routeNodesRef.current[1], {
        autoAlpha: 1,
        scale: 1,
        duration: 0.07,
      }, 0.71)
      tl.to(routeLabelsRef.current[1], {
        autoAlpha: 1,
        y: 0,
        duration: 0.06,
      }, 0.72)

      tl.to(routePathRef.current, {
        strokeDashoffset: routeLength * 0.25,
        duration: 0.13,
        ease: 'power2.inOut',
      }, 0.82)
      tl.to(routeGlowRef.current, {
        strokeDashoffset: routeLength * 0.25,
        duration: 0.13,
        ease: 'power2.inOut',
      }, 0.82)
      tl.to(routeNodesRef.current[2], {
        autoAlpha: 1,
        scale: 1,
        duration: 0.07,
      }, 0.84)
      tl.to(routeLabelsRef.current[2], {
        autoAlpha: 1,
        y: 0,
        duration: 0.06,
      }, 0.85)

      tl.to(routePathRef.current, {
        strokeDashoffset: 0,
        duration: 0.14,
        ease: 'power2.out',
      }, 0.94)
      tl.to(routeGlowRef.current, {
        strokeDashoffset: 0,
        duration: 0.14,
        ease: 'power2.out',
      }, 0.94)
      tl.to(routeNodesRef.current[3], {
        autoAlpha: 1,
        scale: 1,
        duration: 0.07,
      }, 0.96)
      tl.to(routeLabelsRef.current[3], {
        autoAlpha: 1,
        y: 0,
        duration: 0.06,
      }, 0.97)

      // PHASE 4 — Handoff: everything calms, the next chapter is named.
      tl.to(bodyRef.current, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.97)
      tl.to(markerLineRef.current, { scaleX: 1, duration: 0.12, ease: 'power2.out' }, 1.02)
      tl.to(markerRef.current, { autoAlpha: 1, y: 0, duration: 0.12 }, 1.04)
    }, section)

    return () => ctx.revert()
  }, [prefersReducedMotion])

  // --- cursor reactivity (desktop only) --------------------------------------
  useEffect(() => {
    if (prefersReducedMotion || isCoarsePointer) return undefined
    const wrap = wrapRef.current
    if (!wrap) return undefined

    const quick = {}
    Object.keys(WORD_DEPTH).forEach((id) => {
      const el = wordRefs.current[id]
      if (!el) return
      quick[id] = {
        x: gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' }),
        y: gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' }),
        rotationX: gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' }),
        rotationY: gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' }),
      }
    })

    const patternAnn = gsap.quickTo(patternAnnotationRef.current, 'autoAlpha', {
      duration: 0.3,
      ease: 'power2.out',
    })
    const threatAnn = gsap.quickTo(threatAnnotationRef.current, 'autoAlpha', {
      duration: 0.3,
      ease: 'power2.out',
    })

    let frame = null

    const handleMove = (e) => {
      if (frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const rect = wrap.getBoundingClientRect()
        const px = e.clientX - rect.left
        const py = e.clientY - rect.top

        mouseX.set(Math.min(1, Math.max(-1, (px / rect.width) * 2 - 1)))
        mouseY.set(Math.min(1, Math.max(-1, (py / rect.height) * 2 - 1)))

        Object.entries(WORD_DEPTH).forEach(([id, depth]) => {
          const el = wordRefs.current[id]
          const q = quick[id]
          if (!el || !q) return
          const wr = el.getBoundingClientRect()
          const wx = wr.left + wr.width / 2 - rect.left
          const wy = wr.top + wr.height / 2 - rect.top
          const dx = px - wx
          const dy = py - wy
          const dist = Math.hypot(dx, dy)

          if (dist < CURSOR_RADIUS) {
            const t = 1 - dist / CURSOR_RADIUS
            const pull = t * (3 + depth * 5) // ~3–8px, deeper words move a touch more
            q.x(-(dx / CURSOR_RADIUS) * pull)
            q.y(-(dy / CURSOR_RADIUS) * pull)
            q.rotationY((-dx / CURSOR_RADIUS) * t * 5 * depth)
            q.rotationX((dy / CURSOR_RADIUS) * t * 5 * depth)

            if (id === 'b2') patternAnn(Math.min(1, t))
            if (id === 'b5') threatAnn(Math.min(1, t))
          } else {
            q.x(0)
            q.y(0)
            q.rotationX(0)
            q.rotationY(0)
            if (id === 'b2') patternAnn(0)
            if (id === 'b5') threatAnn(0)
          }
        })
      })
    }

    const handleLeave = () => {
      Object.values(quick).forEach((q) => {
        q.x(0)
        q.y(0)
        q.rotationX(0)
        q.rotationY(0)
      })
      patternAnn(0)
      threatAnn(0)
    }

    wrap.addEventListener('mousemove', handleMove)
    wrap.addEventListener('mouseleave', handleLeave)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      wrap.removeEventListener('mousemove', handleMove)
      wrap.removeEventListener('mouseleave', handleLeave)
    }
  }, [prefersReducedMotion, isCoarsePointer, mouseX, mouseY])

  const headlineSize =
    'text-[clamp(2.75rem,7.2vw,6.5rem)] font-semibold leading-[0.98] tracking-[-0.01em] text-ink'

  return (
    <section
      id="difference"
      ref={sectionRef}
      className="relative overflow-hidden bg-paper py-28 md:py-36"
      style={{ minHeight: '92vh' }}
    >
      <div
        className="relative mx-auto flex h-full max-w-[1400px] flex-col justify-between px-6 md:px-10"
        style={{ minHeight: 'calc(92vh - 2px)' }}
      >
        <p ref={labelRef} className="font-mono-tech text-xs text-signal">
          02 — The Signal
        </p>

        <div
          ref={wrapRef}
          className="relative flex flex-1 items-center py-16"
          style={{ perspective: '1200px' }}
        >
          {/* faint corner framing — an instrument's viewfinder, not a graph */}
          <motion.div
            ref={frameRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-6 md:inset-10"
            style={!prefersReducedMotion ? { rotateX: frameRotateX, rotateY: frameRotateY } : undefined}
          >
            {[
              'left-0 top-0 border-l border-t',
              'right-0 top-0 border-r border-t',
              'left-0 bottom-0 border-l border-b',
              'right-0 bottom-0 border-r border-b',
            ].map((pos) => (
              <span key={pos} className={`absolute h-6 w-6 border-ink/15 ${pos}`} />
            ))}
          </motion.div>

          {/* a thin plane that sweeps through the composition at Recognition */}
          <div
            ref={redPlaneRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 top-1/2 h-px origin-center"
            style={{ backgroundColor: RED, opacity: 0 }}
          />

          <motion.div
            ref={stageRef}
            className="relative w-full"
            style={
              !prefersReducedMotion
                ? { transformStyle: 'preserve-3d', rotateX: stageRotateX, rotateY: stageRotateY }
                : undefined
            }
          >
            {/* State A — the isolated event */}
            <div ref={lineARef} className="relative" style={{ transformStyle: 'preserve-3d' }}>
              <h2 className={headlineSize}>
                <span className="block">
                  <span ref={(el) => el && (wordRefs.current.a1 = el)} className="inline-block">
                    One
                  </span>{' '}
                  <span ref={(el) => el && (wordRefs.current.a2 = el)} className="inline-block">
                    event
                  </span>
                </span>
                <span className="block">
                  <span ref={(el) => el && (wordRefs.current.a3 = el)} className="inline-block">
                    is
                  </span>{' '}
                  <span ref={(el) => el && (wordRefs.current.a4 = el)} className="inline-block">
                    noise.
                  </span>
                </span>
              </h2>
            </div>

            {/* State B — the pattern, recognized */}
            <div
              ref={lineBRef}
              className="absolute inset-0"
              style={{ transformStyle: 'preserve-3d' }}
              aria-hidden={false}
            >
              <h2 className={headlineSize}>
                <span className="block">
                  <span ref={(el) => el && (wordRefs.current.b1 = el)} className="inline-block">
                    The
                  </span>{' '}
                  <span
                    ref={(el) => {
                      if (el) {
                        wordRefs.current.b2 = el
                        patternRef.current = el
                      }
                    }}
                    className="relative inline-block"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {PATTERN_LETTERS.map((ch, i) => (
                      <span key={i} className="relative inline-block">
                        {ch}
                        {i < PATTERN_LETTERS.length - 1 && (
                          <span
                            ref={(el) => el && (patternMarkRefs.current[i] = el)}
                            aria-hidden="true"
                            className="font-mono-tech pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px]"
                            style={{ color: RED }}
                          >
                            ·
                          </span>
                        )}
                      </span>
                    ))}
                    <span
                      ref={scanLineRef}
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-0 top-0 w-[2px]"
                      style={{ backgroundColor: RED, opacity: 0 }}
                    />
                    <span
                      ref={patternAnnotationRef}
                      aria-hidden="true"
                      className="font-mono-tech pointer-events-none absolute -bottom-6 left-0 whitespace-nowrap text-[10px] text-ink/40"
                      style={{ opacity: 0 }}
                    >
                      // clustering related events
                    </span>
                  </span>
                </span>
                <span className="block">
                  <span ref={(el) => el && (wordRefs.current.b3 = el)} className="inline-block">
                    is
                  </span>{' '}
                  <span ref={(el) => el && (wordRefs.current.b4 = el)} className="inline-block">
                    the
                  </span>{' '}
                  <span
                    ref={(el) => {
                      if (el) {
                        wordRefs.current.b5 = el
                        threatRef.current = el
                      }
                    }}
                    className="relative inline-block"
                  >
                    threat.
                    <span
                      ref={threatAnnotationRef}
                      aria-hidden="true"
                      className="font-mono-tech pointer-events-none absolute -bottom-6 left-0 whitespace-nowrap text-[10px] text-ink/40"
                      style={{ opacity: 0 }}
                    >
                      // confidence: high
                    </span>
                  </span>
                </span>
              </h2>
            </div>
          </motion.div>

          {/* FORENSIC BACKTRACKING DEVICE
              This replaces the old cursor-positioned red scan line.
              It is deliberately scroll-driven: right → left. */}
          <div
            ref={backtrackTrailRef}
            aria-hidden="true"
            className="pointer-events-none absolute bottom-8 top-8 w-10 -translate-x-1/2"
            style={{
              left: '88%',
              opacity: 0,
              background: `linear-gradient(90deg, transparent, ${RED}18, transparent)`,
            }}
          />

          <div
            ref={backtrackLineRef}
            aria-hidden="true"
            className="pointer-events-none absolute bottom-8 top-8 z-20 w-px"
            style={{ left: '88%', backgroundColor: RED }}
          >
            <span
              className="absolute -left-1.5 top-0 h-3 w-3 rounded-full"
              style={{ backgroundColor: RED }}
            />
            <span
              className="absolute -left-1.5 bottom-0 h-3 w-3 rounded-full"
              style={{ backgroundColor: RED }}
            />
          </div>

          {/* Hidden context uncovered by the backtracking cursor. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
          >
            <span
              ref={(el) => (backtrackLabelsRef.current[0] = el)}
              className="font-mono-tech absolute right-[28%] top-[15%] whitespace-nowrap text-[10px] uppercase tracking-[0.18em] text-ink/40"
            >
              context recovered
            </span>

            <span
              ref={(el) => (backtrackLabelsRef.current[1] = el)}
              className="font-mono-tech absolute right-[38%] bottom-[20%] whitespace-nowrap text-[10px] uppercase tracking-[0.18em] text-ink/40"
            >
              sequence reconstructed
            </span>

            <span
              ref={(el) => (backtrackLabelsRef.current[2] = el)}
              className="font-mono-tech absolute left-[14%] top-[24%] whitespace-nowrap text-[10px] uppercase tracking-[0.18em] text-signal"
            >
              tracing origin
            </span>

            {/* Persistent tracking view. It is visible immediately so the
                user can understand what the scroll is doing: the red route
                grows from one system location to the previous one. */}
            <div
              ref={evidenceCardRef}
              className="absolute right-[4%] top-[10%] h-[70%] w-[48%] min-w-[430px] md:right-[5%] md:w-[50%]"
            >
              <div className="absolute left-0 top-0 flex items-center gap-3">
                <span className="font-mono-tech text-[9px] uppercase tracking-[0.2em] text-ink/35">
                  incident trace
                </span>
                <span
                  ref={routeStatusRef}
                  className="font-mono-tech text-[9px] uppercase tracking-[0.2em] text-signal"
                >
                  backtracking
                </span>
              </div>

              <svg
                viewBox="0 0 640 430"
                className="absolute inset-0 h-full w-full overflow-visible"
                aria-hidden="true"
              >
                {/* very faint coordinate field */}
                <path
                  d="M60 70H590 M60 215H590 M60 360H590"
                  stroke="currentColor"
                  strokeOpacity="0.055"
                  strokeWidth="1"
                />
                <path
                  d="M130 35V395 M320 35V395 M510 35V395"
                  stroke="currentColor"
                  strokeOpacity="0.055"
                  strokeWidth="1"
                />

                {/* soft route underlay */}
                <path
                  ref={routeGlowRef}
                  d="M520 105 C455 120 472 185 395 190 S315 160 275 225 S180 300 112 345"
                  fill="none"
                  stroke={RED}
                  strokeWidth="7"
                  strokeLinecap="round"
                  opacity="0.15"
                />

                {/* precise forensic route */}
                <path
                  ref={routePathRef}
                  d="M520 105 C455 120 472 185 395 190 S315 160 275 225 S180 300 112 345"
                  fill="none"
                  stroke={RED}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {[
                  { x: 520, y: 105 },
                  { x: 395, y: 190 },
                  { x: 275, y: 225 },
                  { x: 112, y: 345 },
                ].map((p, i) => (
                  <g
                    key={i}
                    ref={(el) => (routeNodesRef.current[i] = el)}
                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                  >
                    <circle cx={p.x} cy={p.y} r="9" fill="white" stroke={RED} strokeWidth="1" />
                    <circle cx={p.x} cy={p.y} r="3.5" fill={RED} />
                  </g>
                ))}
              </svg>

              {[
                {
                  refIndex: 0,
                  className: 'absolute right-[11%] top-[18%]',
                  id: 'NET-7731',
                  title: 'outbound connection',
                  meta: '03:45:11',
                },
                {
                  refIndex: 1,
                  className: 'absolute right-[31%] top-[38%]',
                  id: 'HOST-5512',
                  title: 'production host',
                  meta: '03:44:02',
                },
                {
                  refIndex: 2,
                  className: 'absolute right-[50%] top-[47%]',
                  id: 'SESSION-1042',
                  title: 'privilege escalation',
                  meta: '03:43:04',
                },
                {
                  refIndex: 3,
                  className: 'absolute left-[8%] bottom-[4%]',
                  id: 'AUTH-4821',
                  title: 'unusual login',
                  meta: '03:42:18',
                },
              ].map((item) => (
                <div
                  key={item.id}
                  ref={(el) => (routeLabelsRef.current[item.refIndex] = el)}
                  className={`${item.className} w-[150px]`}
                >
                  <p className="font-mono-tech text-[10px] tracking-[0.08em] text-ink/70">
                    {item.id}
                  </p>
                  <p className="mt-1 text-[11px] leading-tight text-ink/50">
                    {item.title}
                  </p>
                  <p className="mt-1 font-mono-tech text-[9px] text-ink/25">
                    {item.meta}
                  </p>
                </div>
              ))}
            </div>

            <span
              ref={originRef}
              className="font-mono-tech absolute left-[10%] bottom-[7%] -translate-x-1/2 whitespace-nowrap text-[10px] uppercase tracking-[0.18em] text-signal"
            >
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ backgroundColor: RED }} />
              origin located
            </span>
          </div>

          {!prefersReducedMotion && !isCoarsePointer && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-8 top-8 w-px"
              style={{ left: '50%', backgroundColor: `${RED}18` }}
            />
          )}
        </div>

        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <p ref={bodyRef} className="max-w-sm text-lg leading-relaxed text-ink/70">
            SAOM AI traces the event backward — location by location — until the origin becomes visible.
          </p>

          <div ref={markerRef} className="flex items-center gap-4">
            <span ref={markerLineRef} className="h-px w-16 origin-left bg-ink/30" />
            <p className="font-mono-tech text-xs text-ink/50">
              <span className="text-signal">04</span> — Detect
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}