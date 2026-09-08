   import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion, useReducedMotion } from 'framer-motion'

gsap.registerPlugin(ScrollTrigger)

const RED = '#e4002b'

const STAGES = [
  {
    tag: '04 — Detect',
    title: 'Continuous monitoring.',
    body: 'SAOM AI watches authentication, network, and endpoint activity around the clock, scoring every event as it happens.',
  },
  {
    tag: '05 — Investigate',
    title: 'Events become a story.',
    body: 'Related signals are pulled together across systems and time into a single, ordered sequence of what actually happened.',
  },
  {
    tag: '06 — Understand',
    title: 'Credential compromise detected.',
    body: 'An unusual login was followed by privilege escalation on a production host, then an outbound connection to an unfamiliar destination.',
  },
  {
    tag: '07 — Respond',
    title: 'A recommended path, ready to act on.',
    body: 'Isolate the host, revoke the active session, and notify the on-call engineer — SAOM AI proposes the response, your team approves it.',
  },
]

// The four "Level 3" anomalous events — these are the actual attack path
// used across Detect / Investigate / Understand / Respond. Positions are
// deliberately chosen (not randomized) and left untouched by this pass.
const ATTACK_NODES = [
  { id: 'auth', label: 'AUTH-4821', name: 'Unusual login', time: '03:42:18', x: 16, y: 28 },
  { id: 'priv', label: 'SESSION-1042', name: 'Privilege escalation', time: '03:43:04', x: 44, y: 16 },
  { id: 'host', label: 'HOST-5512', name: 'Production host accessed', time: '03:44:02', x: 64, y: 58 },
  { id: 'net', label: 'NET-7731', name: 'Outbound connection', time: '03:45:11', x: 86, y: 40 },
]

const RESPONSE_ACTIONS = [
  { id: 'isolate', label: 'Isolate host' },
  { id: 'revoke', label: 'Revoke session' },
  { id: 'notify', label: 'Notify security team' },
]

// --- Stage 04 signal field -------------------------------------------------
// Deterministic, hand-placed "Level 1" (quiet) and "Level 2" (noteworthy)
// events. Coordinates are chosen with generous spacing so labels never
// collide with each other, with the ATTACK_NODES, or with the canvas edge.
// `side` controls which direction the label reads from its node, alternated
// so neighboring labels never point at one another.
const SIGNAL_EVENTS = [
  // Level 1 — normal background activity, quiet by default
  { id: 'sig-1', tier: 1, label: 'HOST-1123', time: '03:41:02', x: 4, y: 12, side: 'right' },
  { id: 'sig-2', tier: 1, label: 'NET-6642', time: '03:41:19', x: 26, y: 50, side: 'right' },
  { id: 'sig-3', tier: 1, label: 'PROC-3309', time: '03:41:34', x: 50, y: 46, side: 'left' },
  { id: 'sig-4', tier: 1, label: 'AUTH-2277', time: '03:41:47', x: 78, y: 26, side: 'bottom' },
  { id: 'sig-5', tier: 1, label: 'SESSION-8814', time: '03:41:58', x: 94, y: 20, side: 'left' },
  { id: 'sig-6', tier: 1, label: 'HOST-4456', time: '03:42:05', x: 78, y: 90, side: 'top' },
  // Level 2 — noteworthy, a little more present
  { id: 'sig-7', tier: 2, label: 'PROC-7515', time: '03:42:09', x: 8, y: 66, side: 'right' },
  { id: 'sig-8', tier: 2, label: 'NET-2290', time: '03:42:14', x: 34, y: 78, side: 'top' },
  { id: 'sig-9', tier: 2, label: 'SESSION-3187', time: '03:42:16', x: 60, y: 8, side: 'bottom' },
  { id: 'sig-10', tier: 2, label: 'AUTH-9034', time: '03:42:20', x: 92, y: 74, side: 'left' },
]

// The order the field reveals itself in as the user scrolls into Stage 04 —
// a few quiet events, a pause, a few more, then a suspicious one surfaces.
const REVEAL_SEQUENCE = [
  ['sig-1', 'sig-2', 'sig-3'],
  ['sig-4', 'sig-5', 'sig-6'],
  ['sig-7', 'sig-8'],
  ['auth'],
  ['sig-9', 'sig-10'],
  ['priv', 'host', 'net'],
]
const REVEAL_POSITIONS = [0.02, 0.22, 0.42, 0.5, 0.62, 0.8]

const LABEL_SIDE_CLASS = {
  right: 'absolute left-full ml-2 top-1/2 -translate-y-1/2 text-left',
  left: 'absolute right-full mr-2 top-1/2 -translate-y-1/2 text-right',
  top: 'absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-center',
  bottom: 'absolute top-full mt-2 left-1/2 -translate-x-1/2 text-center',
}

export default function PinnedStory() {
  const sectionRef = useRef(null)
  const stageRefs = useRef([])
  const progressRefs = useRef([])

  const canvasWrapRef = useRef(null)
  const decoyGroupRef = useRef(null)
  const signalNodeRefs = useRef({})
  const attackNodeRefs = useRef({})
  const lineRefs = useRef([])
  const pathGlowRef = useRef(null)
  const gaugeCircleRef = useRef(null)
  const gaugeTextRef = useRef(null)
  const understandLabelsRef = useRef(null)
  const timelineListRef = useRef(null)
  const responsePanelRef = useRef(null)
  const actionRefs = useRef([])
  const checkRefs = useRef([])

  // Small analyst cursor for the investigation canvas.
  const analystCursorRef = useRef(null)
  const analystRingRef = useRef(null)

  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) return undefined

    const ctx = gsap.context(() => {
      const stages = stageRefs.current
      const lines = lineRefs.current
      const actions = actionRefs.current
      const checks = checkRefs.current
      const signalNodes = Object.values(signalNodeRefs.current)
      const attackNodes = Object.values(attackNodeRefs.current)

      // --- initial state -------------------------------------------------
      gsap.set(stages, { autoAlpha: 0, y: 24 })
      gsap.set(stages[0], { autoAlpha: 1, y: 0 })
      gsap.set(progressRefs.current[0], { backgroundColor: RED })

      // Stage 04 field starts hidden — it reveals itself gradually as the
      // user scrolls in, rather than appearing all at once.
      gsap.set(signalNodes, { autoAlpha: 0, y: 8, scale: 0.85, filter: 'blur(6px)' })
      gsap.set(attackNodes, { autoAlpha: 0, y: 8, scale: 0.75, filter: 'blur(6px)' })

      gsap.set(lines, { opacity: 0.15 })
      lines.forEach((line) => {
        if (!line) return
        const length = line.getTotalLength()
        gsap.set(line, { strokeDasharray: length, strokeDashoffset: length })
      })

      gsap.set(gaugeCircleRef.current, { strokeDashoffset: 264 })
      gsap.set([pathGlowRef.current, understandLabelsRef.current, timelineListRef.current], {
        autoAlpha: 0,
      })
      gsap.set(responsePanelRef.current, { autoAlpha: 0, y: 32 })
      gsap.set(actions, { autoAlpha: 0, x: -12 })
      gsap.set(checks, { autoAlpha: 0, scale: 0.6 })

      // gentle idle float — independent of scroll
      gsap.to(canvasWrapRef.current, {
        y: -6,
        duration: 4.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })

      const isMobile = window.matchMedia('(max-width: 767px)').matches
      const distance = isMobile ? '+=340%' : '+=280%'

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: distance,
          scrub: 0.7,
          pin: true,
          anticipatePin: 1,
        },
      })

      // --- Stage 04: the signal field reveals itself, in waves -----------
      REVEAL_SEQUENCE.forEach((ids, i) => {
        const targets = ids
          .map((id) => signalNodeRefs.current[id] || attackNodeRefs.current[id])
          .filter(Boolean)
        tl.to(
          targets,
          { autoAlpha: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.35, stagger: 0.08, ease: 'power2.out' },
          REVEAL_POSITIONS[i]
        )
      })

      stages.forEach((el, i) => {
        if (i > 0) {
          tl.to(stages[i - 1], { autoAlpha: 0, y: -24, duration: 0.4 }, i)
          tl.fromTo(el, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.4 }, i)
          tl.to(progressRefs.current, { backgroundColor: '#3a3a38', duration: 0.2 }, i)
          tl.to(progressRefs.current[i], { backgroundColor: RED, duration: 0.2 }, i)
        }
      })

      // --- Detect -> Investigate: the signal field starts connecting -----
      tl.to(lines, { strokeDashoffset: 0, opacity: 0.85, duration: 0.8, stagger: 0.15 }, 1)
      tl.to(decoyGroupRef.current, { opacity: 0.4, duration: 0.6 }, 1)
      tl.to(canvasWrapRef.current, { rotateY: -6, rotateX: 3, duration: 0.8 }, 1)

      // --- Investigate -> Understand: the attack path reveals itself -----
      tl.to(decoyGroupRef.current, { opacity: 0.06, duration: 0.6 }, 2)
      tl.to(lines, { opacity: 1, duration: 0.5 }, 2)
      tl.to(pathGlowRef.current, { autoAlpha: 1, duration: 0.5 }, 2)
      tl.to(gaugeCircleRef.current, { strokeDashoffset: 34, duration: 1 }, 2)
      tl.to(
        { value: 0 },
        {
          value: 87,
          duration: 1,
          onUpdate: function tickGauge() {
            if (gaugeTextRef.current) {
              gaugeTextRef.current.textContent = `${Math.round(this.targets()[0].value)}%`
            }
          },
        },
        2
      )
      tl.to(understandLabelsRef.current, { autoAlpha: 1, duration: 0.4 }, 2.2)
      tl.to(timelineListRef.current, { autoAlpha: 1, duration: 0.4 }, 2.3)
      tl.to(canvasWrapRef.current, { rotateY: 0, rotateX: 0, duration: 0.8 }, 2)

      // --- Understand -> Respond: the graph collapses into a decision ----
      tl.to(
        [decoyGroupRef.current, pathGlowRef.current, understandLabelsRef.current, timelineListRef.current],
        { autoAlpha: 0, duration: 0.5 },
        3
      )
      tl.to(lines, { opacity: 0.1, duration: 0.5 }, 3)
      tl.to(attackNodes, { autoAlpha: 0, scale: 0.6, duration: 0.5 }, 3)
      tl.to(canvasWrapRef.current, { scale: 0.94, duration: 0.6 }, 3)
      tl.to(responsePanelRef.current, { autoAlpha: 1, y: 0, duration: 0.6 }, 3.2)
      tl.to(actions, { autoAlpha: 1, x: 0, duration: 0.4, stagger: 0.25 }, 3.35)
      tl.to(checks, { autoAlpha: 1, scale: 1, duration: 0.3, stagger: 0.25 }, 3.5)
    }, sectionRef)

    return () => ctx.revert()
  }, [prefersReducedMotion])

  // --- analyst cursor interaction ------------------------------------------
  // Keeps the pinned story feeling like an active investigation without
  // adding another dashboard or decorative graph layer.
  useEffect(() => {
    if (prefersReducedMotion) return undefined

    const canvas = document.querySelector('.pinned-story-canvas')
    const cursor = analystCursorRef.current
    const ring = analystRingRef.current
    if (!canvas || !cursor || !ring) return undefined

    const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches
    if (isTouch) return undefined

    const moveX = gsap.quickTo(cursor, 'x', { duration: 0.25, ease: 'power3.out' })
    const moveY = gsap.quickTo(cursor, 'y', { duration: 0.25, ease: 'power3.out' })
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' })
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' })
    const scaleRing = gsap.quickTo(ring, 'scale', { duration: 0.3, ease: 'power2.out' })

    const handleMove = (event) => {
      const rect = canvas.getBoundingClientRect()
      moveX(event.clientX - rect.left)
      moveY(event.clientY - rect.top)
      ringX(event.clientX - rect.left)
      ringY(event.clientY - rect.top)
    }

    const handleEnter = () => {
      gsap.to([cursor, ring], { autoAlpha: 1, duration: 0.2 })
      scaleRing(1)
    }

    const handleLeave = () => {
      gsap.to([cursor, ring], { autoAlpha: 0, duration: 0.2 })
    }

    canvas.addEventListener('mousemove', handleMove)
    canvas.addEventListener('mouseenter', handleEnter)
    canvas.addEventListener('mouseleave', handleLeave)

    return () => {
      canvas.removeEventListener('mousemove', handleMove)
      canvas.removeEventListener('mouseenter', handleEnter)
      canvas.removeEventListener('mouseleave', handleLeave)
    }
  }, [prefersReducedMotion])

  const graphContent = (
    <>
      <div ref={decoyGroupRef} className="absolute inset-0" aria-hidden="true">
        {SIGNAL_EVENTS.map((ev) => {
          const isTier2 = ev.tier === 2
          return (
            <motion.div
              key={ev.id}
              ref={(el) => el && (signalNodeRefs.current[ev.id] = el)}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${ev.x}%`, top: `${ev.y}%` }}
              whileHover={{ scale: 1.5 }}
              transition={{ type: 'spring', stiffness: 340, damping: 18 }}
            >
              <span className="pinned-story-visual inline-block transition-opacity duration-300">
                <span
                  className={`pinned-story-pulse block rounded-full ${
                    isTier2 ? 'h-[6px] w-[6px] bg-paper/70' : 'h-[4px] w-[4px] bg-paper/35'
                  }`}
                  style={{ animationDuration: isTier2 ? '4s' : '5.5s' }}
                />
                <span className={`${LABEL_SIDE_CLASS[ev.side]} whitespace-nowrap`}>
                  <span
                    className={`font-mono-tech block text-[9px] transition-colors duration-300 ${
                      isTier2 ? 'text-paper/60 group-hover:text-signal' : 'text-paper/0 group-hover:text-paper/70'
                    }`}
                  >
                    {ev.label}
                  </span>
                  <span className="font-mono-tech block text-[8px] text-paper/0 transition-opacity duration-300 group-hover:text-paper/45">
                    {ev.time}
                  </span>
                </span>
              </span>
            </motion.div>
          )
        })}
      </div>

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <g ref={pathGlowRef} style={{ mixBlendMode: 'screen' }}>
          {ATTACK_NODES.slice(0, -1).map((node, i) => {
            const next = ATTACK_NODES[i + 1]
            return (
              <path
                key={`glow-${node.id}`}
                d={`M ${node.x} ${node.y} L ${next.x} ${next.y}`}
                stroke={RED}
                strokeWidth="1.4"
                strokeOpacity="0.35"
                fill="none"
                style={{ filter: 'blur(1.5px)' }}
              />
            )
          })}
        </g>
        {ATTACK_NODES.slice(0, -1).map((node, i) => {
          const next = ATTACK_NODES[i + 1]
          const d = `M ${node.x} ${node.y} L ${next.x} ${next.y}`
          return (
            <g key={`line-${node.id}`}>
              <path
                ref={(el) => el && (lineRefs.current[i] = el)}
                d={d}
                stroke={RED}
                strokeWidth="0.35"
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
              <circle r="0.9" fill={RED}>
                <animateMotion dur="2.6s" repeatCount="indefinite" path={d} />
              </circle>
            </g>
          )
        })}
      </svg>

      {ATTACK_NODES.map((node) => (
        <motion.div
          key={node.id}
          ref={(el) => el && (attackNodeRefs.current[node.id] = el)}
          className="group absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          whileHover={{ scale: 1.3 }}
          transition={{ type: 'spring', stiffness: 300, damping: 16 }}
        >
          <span className="pinned-story-visual inline-block transition-opacity duration-300">
            <span
              className="pinned-story-pulse block h-[7px] w-[7px] rounded-full"
              style={{ backgroundColor: RED }}
            />
            <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap text-left">
              <span className="font-mono-tech block text-[10px] text-paper transition-colors duration-300 group-hover:text-white">
                {node.label}
              </span>
              <span className="font-mono-tech block text-[8px] text-paper/0 transition-opacity duration-300 group-hover:text-paper/50">
                {node.time}
              </span>
            </span>
          </span>
        </motion.div>
      ))}

      <div ref={understandLabelsRef} className="absolute right-0 top-0 w-[168px] text-right">
        <p className="font-mono-tech text-[10px] text-paper/50">threat confidence</p>
        <svg viewBox="0 0 100 100" className="mx-auto mt-2 h-24 w-24 -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#3a3a38" strokeWidth="6" />
          <circle
            ref={gaugeCircleRef}
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={RED}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="264"
            strokeDashoffset="34"
          />
        </svg>
        <p ref={gaugeTextRef} className="font-mono-tech -mt-16 text-lg text-paper">
          87%
        </p>
        <p className="font-mono-tech mt-10 text-[11px] uppercase tracking-wide text-signal">
          credential compromise detected
        </p>
      </div>

      <ol ref={timelineListRef} className="absolute bottom-0 left-0 flex flex-col gap-2">
        {ATTACK_NODES.map((node) => (
          <li key={`tl-${node.id}`} className="font-mono-tech flex items-baseline gap-3 text-[11px]">
            <span className="text-paper/40">{node.time}</span>
            <span className="text-paper/80">{node.name}</span>
          </li>
        ))}
      </ol>
    </>
  )

  const responseContent = (
    <>
      <div>
        <p className="font-mono-tech text-xs text-paper/50">incident understood</p>
        <p className="font-mono-tech text-xs text-signal">high confidence</p>
      </div>
      <ul className="flex flex-col gap-4">
        {RESPONSE_ACTIONS.map((action, i) => (
          <motion.li
            key={action.id}
            ref={(el) => el && (actionRefs.current[i] = el)}
            className="flex items-center justify-between border-b border-paper/15 pb-3 text-base"
            whileHover={{ x: 4, color: RED }}
          >
            <span>
              {String(i + 1).padStart(2, '0')}&nbsp;&nbsp;{action.label}
            </span>
            <svg ref={(el) => el && (checkRefs.current[i] = el)} width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M3 9.5 L7.2 13.5 L15 4.5" fill="none" stroke={RED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.li>
        ))}
      </ul>
      <p className="max-w-xs text-sm leading-relaxed text-paper/60">SAOM AI proposes. Your team approves.</p>
    </>
  )

  return (
    <section
      id="story"
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-ink text-paper"
    >
      <style>{`
        @keyframes pinned-story-pulse-kf {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.25); }
        }
        .pinned-story-pulse { animation: pinned-story-pulse-kf 3.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .pinned-story-pulse { animation: none; }
        }
        .pinned-story-canvas:hover .group:not(:hover) .pinned-story-visual {
          opacity: 0.5;
        }
      `}</style>

      <h2 className="sr-only">
        SAOM AI detects a signal, investigates the connections, understands the attack, and responds.
      </h2>

      {/* LIVE TELEMETRY STRIP */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 px-6 md:px-10">
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-2 border-b border-paper/10 py-4 md:grid-cols-4">
          <div className="flex items-center gap-2 border-paper/10 py-1 md:border-r md:px-5 md:first:pl-0">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-50" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
            </span>
            <span className="font-mono-tech text-[9px] uppercase tracking-[0.16em] text-paper/55">
              Live system
            </span>
          </div>

          <div className="flex items-center justify-between border-paper/10 py-1 md:border-r md:px-5">
            <span className="font-mono-tech text-[9px] uppercase tracking-[0.16em] text-paper/35">
              Events / 24h
            </span>
            <span className="font-mono-tech text-[10px] text-paper/70">
              18,492
            </span>
          </div>

          <div className="hidden items-center justify-between border-paper/10 py-1 md:flex md:border-r md:px-5">
            <span className="font-mono-tech text-[9px] uppercase tracking-[0.16em] text-paper/35">
              Systems watched
            </span>
            <span className="font-mono-tech text-[10px] text-paper/70">
              1,842
            </span>
          </div>

          <div className="flex items-center justify-between py-1 md:px-5 md:pr-0">
            <span className="font-mono-tech text-[9px] uppercase tracking-[0.16em] text-paper/35">
              Status
            </span>
            <span className="font-mono-tech text-[10px] text-signal">
              Operational
            </span>
          </div>
        </div>
      </div>

      <div
        className={`relative z-10 mx-auto flex w-full max-w-[1400px] flex-col justify-center gap-10 px-6 py-16 md:flex-row md:items-center md:gap-16 md:px-10 ${
          prefersReducedMotion ? '' : 'h-screen md:py-0'
        }`}
      >
        <div className="order-2 w-full md:order-2 md:w-[42%]">
          <p className="mb-7 font-mono-tech text-[9px] uppercase tracking-[0.22em] text-paper/35">
            live investigation
          </p>
          {prefersReducedMotion ? (
            <div className="flex flex-col gap-10">
              {STAGES.map((s, i) => (
                <div key={i}>
                  <p className="font-mono-tech mb-4 text-xs text-signal">{s.tag}</p>
                  <h3 className="text-2xl font-semibold leading-tight md:text-3xl">{s.title}</h3>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-paper/70">{s.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative h-[260px] max-w-lg md:h-[250px]">
              {STAGES.map((s, i) => (
                <div key={i} ref={(el) => el && (stageRefs.current[i] = el)} className="absolute inset-0">
                  <p className="font-mono-tech mb-5 text-xs text-signal">{s.tag}</p>
                  <h3 className="text-3xl font-semibold leading-tight md:text-4xl">{s.title}</h3>
                  <p className="mt-5 max-w-md text-base leading-relaxed text-paper/70">{s.body}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex gap-2">
            {STAGES.map((_, i) => (
              <span
                key={i}
                ref={(el) => el && (progressRefs.current[i] = el)}
                className="h-px w-10 bg-[#3a3a38] transition-colors"
              />
            ))}
          </div>

        </div>

        {prefersReducedMotion ? (
          <div className="order-1 flex w-full flex-col gap-8 md:order-1 md:w-[58%]">
            <div className="pinned-story-canvas relative mx-auto aspect-[4/3] w-full max-w-xl" style={{ perspective: '1400px' }}>
              <div ref={canvasWrapRef} className="relative h-full w-full">
                {graphContent}
              </div>
            </div>
            <div className="mx-auto flex w-full max-w-xl flex-col gap-6">{responseContent}</div>
          </div>
        ) : (
          <div className="order-1 pinned-story-canvas relative w-full md:order-1 md:w-[58%]" style={{ perspective: '1400px' }}>
            <div ref={canvasWrapRef} className="relative aspect-[4/3] w-full" style={{ transformStyle: 'preserve-3d' }}>
              <span
                ref={analystRingRef}
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0 z-30 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-signal/45 opacity-0"
              />
              <span
                ref={analystCursorRef}
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0 z-30 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal opacity-0"
              />
              {graphContent}
              <div ref={responsePanelRef} className="absolute inset-0 flex flex-col justify-center gap-6 bg-ink">
                {responseContent}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}