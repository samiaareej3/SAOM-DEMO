  import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ---------------------------------------------------------------------------
// CONCEPT — THE TRIAGE LINE
//
// The old version told this section's story as a field that resolves: forty
// scattered points, assembling once, settling into a finished grid. That's
// wrong for what "autonomous operations" actually is — it never finishes.
// So this is a line, not a chamber: signals stream in continuously from the
// left, cross a single visible point where SAOM AI actually judges them —
// its reasoning flashes as real text, not a spinner — and then split. Most
// dissolve back into ambient noise, cleared and forgotten on purpose. A few
// crystallize into a case and get physically handed to a queue on the
// right, which periodically opens one to show what a human actually
// receives: not raw signal, but a reconstructed, reasoned case.
//
// It runs on its own, continuously, independent of scroll once it's in
// view — because "never stops" only means something if it's still going
// when you stop looking at it.
// ---------------------------------------------------------------------------

const RED = '#ED1C2E'
const GOLD = '#C7951B'

const GLYPHS = [
  '4F', 'A2', '9C', 'E1', '7B', 'D5', '2A', 'C8', 'F3', '61',
  '9D', 'B4', '3E', 'A7', '58', 'D2', '6C', 'F9', '12', 'E4',
]

const CLEAR_REASONS = [
  'known device — cleared', 'scheduled scan — cleared', 'cert renewal — benign',
  'matches baseline — cleared', 'batch job — expected', 'MFA satisfied — cleared',
]
const ESCALATE_REASONS = [
  'impossible travel — escalate', 'priv. escalation — escalate', 'MFA bypass attempt — escalate',
  'geo mismatch — escalate', 'creds reused off-hours — escalate',
]
const CASE_SUMMARIES = [
  '3 failed MFA, new geo, then success', 'service account used interactively',
  'lateral move after phishing click', 'token replay from stale session',
  'admin role granted, no ticket',
]

const ESCALATE_PROB = 0.16
const SPAWN_MS = 480
const MAX_CARDS = 4
const CARD_H = 40
const CARD_GAP = 8

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ---------------------------------------------------------------------------
// AMBIENT PARTICLE FIELD — quiet depth behind the line, always alive.
// ---------------------------------------------------------------------------

function ParticleField({ active }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!active) return undefined
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')

    let width = 0
    let height = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const points = Array.from({ length: 60 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00025,
      vy: (Math.random() - 0.5) * 0.00025,
      r: 0.6 + Math.random() * 1.2,
      a: 0.05 + Math.random() * 0.12,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      points.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = 1
        if (p.x > 1) p.x = 0
        if (p.y < 0) p.y = 1
        if (p.y > 1) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x * width, p.y * height, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${p.a})`
        ctx.fill()
      })
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [active])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
      style={{ filter: 'blur(1px)' }}
    />
  )
}

function Word({ children, muted = false }) {
  return (
    <span className="inline-block overflow-hidden pb-[0.1em] align-bottom">
      <span className={`aso-word inline-block ${muted ? 'text-ink/45' : ''}`}>{children}</span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export default function AutonomousSOC() {
  const sectionRef = useRef(null)
  const chamberRef = useRef(null)
  const fieldRef = useRef(null)
  const laneRef = useRef(null)
  const apertureRef = useRef(null)
  const stackRef = useRef(null)
  const counterRef = useRef(null)
  const clearedBarRef = useRef(null)
  const escalatedBarRef = useRef(null)

  const cardsRef = useRef([]) // [{ el, summary }] newest first
  const activeMotesRef = useRef([]) // [{ el, xSet, ySet }]
  const statsRef = useRef({ cleared: 812, escalated: 61, counter: 1204 })
  const cursorRef = useRef({ x: 0, y: 0 })
  const rafPending = useRef(false)
  const spawnTimer = useRef(null)
  const flipTimer = useRef(null)
  const counterTimer = useRef(null)

  const [apertureHot, setApertureHot] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  // ---- whole-chamber cursor tilt -------------------------------------------
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 90, damping: 18, mass: 0.6 })
  const sy = useSpring(my, { stiffness: 90, damping: 18, mass: 0.6 })
  const rotateY = useTransform(sx, [-0.5, 0.5], [-4, 4])
  const rotateX = useTransform(sy, [-0.5, 0.5], [3, -3])

  function updateStatsBar() {
    const { cleared, escalated } = statsRef.current
    const total = cleared + escalated || 1
    if (clearedBarRef.current) clearedBarRef.current.style.width = `${(cleared / total) * 100}%`
    if (escalatedBarRef.current) escalatedBarRef.current.style.width = `${(escalated / total) * 100}%`
  }

  // ---- cursor: magnetic pull on in-flight motes + aperture heat ----------
  function handleChamberMouseMove(e) {
    if (prefersReducedMotion) return
    const rect = fieldRef.current?.getBoundingClientRect()
    if (rect) {
      mx.set((e.clientX - rect.left) / rect.width - 0.5)
      my.set((e.clientY - rect.top) / rect.height - 0.5)
    }
    cursorRef.current = { x: e.clientX, y: e.clientY }

    if (rafPending.current) return
    rafPending.current = true
    requestAnimationFrame(() => {
      rafPending.current = false
      const THRESH = 90
      activeMotesRef.current.forEach((m) => {
        if (!m.el) return
        const r = m.el.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        const dx = cursorRef.current.x - cx
        const dy = cursorRef.current.y - cy
        const dist = Math.hypot(dx, dy) || 1
        if (dist < THRESH) {
          const f = (1 - dist / THRESH) * 7
          m.xSet((dx / dist) * f)
          m.ySet((dy / dist) * f)
        } else {
          m.xSet(0)
          m.ySet(0)
        }
      })

      if (apertureRef.current) {
        const ar = apertureRef.current.getBoundingClientRect()
        const dist = Math.abs(cursorRef.current.x - (ar.left + ar.width / 2))
        setApertureHot(dist < 80)
      }
    })
  }

  function handleChamberMouseLeave() {
    mx.set(0)
    my.set(0)
    activeMotesRef.current.forEach((m) => {
      m.xSet?.(0)
      m.ySet?.(0)
    })
    setApertureHot(false)
  }

  // ---- card queue: create, stack, hover-to-peek ---------------------------
  function layoutStack() {
    cardsRef.current.forEach((c, i) => {
      gsap.to(c.el, { top: i * (CARD_H + CARD_GAP), duration: 0.45, ease: 'power3.out' })
    })
  }

  function flipCard(el, open) {
    gsap.to(el, { rotateY: open ? 180 : 0, duration: 0.55, ease: 'power2.inOut' })
  }

  function addCard(summary) {
    if (!stackRef.current) return
    const el = document.createElement('div')
    el.className = 'aso-card'
    el.style.top = '-44px'
    el.innerHTML = `
      <div class="aso-card-front">CASE</div>
      <div class="aso-card-back">${summary}</div>
    `
    el.addEventListener('mouseenter', () => flipCard(el, true))
    el.addEventListener('mouseleave', () => flipCard(el, false))
    stackRef.current.appendChild(el)
    cardsRef.current.unshift({ el, summary })

    gsap.fromTo(
      el,
      { opacity: 0, scale: 0.7, y: -10 },
      { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'back.out(2)' }
    )

    if (cardsRef.current.length > MAX_CARDS) {
      const old = cardsRef.current.pop()
      gsap.to(old.el, {
        x: 140,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.in',
        onComplete: () => old.el.remove(),
      })
    }
    layoutStack()
  }

  // ---- mote lifecycle -------------------------------------------------------
  function resolveMote(el, yPct, willEscalate) {
    activeMotesRef.current = activeMotesRef.current.filter((m) => m.el !== el)

    const reason = willEscalate ? rand(ESCALATE_REASONS) : rand(CLEAR_REASONS)
    const label = document.createElement('div')
    label.className = `aso-reason ${willEscalate ? 'is-escalate' : 'is-clear'}`
    label.textContent = reason
    label.style.left = '46%'
    label.style.top = `${yPct}%`
    laneRef.current?.appendChild(label)
    gsap.fromTo(label, { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.25 })
    gsap.to(label, { opacity: 0, y: '-=10', duration: 0.5, delay: 1.0, onComplete: () => label.remove() })

    if (willEscalate) {
      statsRef.current.escalated += 1
      gsap.to(el, {
        left: '90%',
        top: '12%',
        scale: 0.65,
        backgroundColor: 'rgba(237,28,46,0.92)',
        borderColor: 'rgba(237,28,46,0.6)',
        color: '#fff',
        duration: 0.9,
        ease: 'power2.inOut',
        onComplete: () => {
          el.remove()
          addCard(rand(CASE_SUMMARIES))
        },
      })

      if (apertureRef.current) {
        gsap.fromTo(
          apertureRef.current,
          { boxShadow: `0 0 0px 0px ${RED}00` },
          {
            boxShadow: `0 0 46px 8px ${RED}33`,
            duration: 0.3,
            ease: 'power2.out',
            yoyo: true,
            repeat: 1,
          }
        )
      }
    } else {
      statsRef.current.cleared += 1
      for (let i = 0; i < 4; i += 1) {
        const dust = document.createElement('div')
        dust.className = 'aso-dust'
        dust.style.left = el.style.left
        dust.style.top = el.style.top
        laneRef.current?.appendChild(dust)
        gsap.to(dust, {
          left: `+=${(Math.random() - 0.5) * 60}`,
          top: `+=${(Math.random() - 0.5) * 60}`,
          opacity: 0,
          duration: 0.8 + Math.random() * 0.4,
          ease: 'power1.out',
          onComplete: () => dust.remove(),
        })
      }
      gsap.to(el, {
        opacity: 0,
        scale: 0.3,
        filter: 'blur(3px)',
        duration: 0.5,
        ease: 'power1.out',
        onComplete: () => el.remove(),
      })
    }

    updateStatsBar()
  }

  function spawnMote() {
    if (!laneRef.current) return
    const yPct = 12 + Math.random() * 68
    const el = document.createElement('div')
    el.className = 'aso-mote'
    el.textContent = rand(GLYPHS)
    el.style.left = '-4%'
    el.style.top = `${yPct}%`
    laneRef.current.appendChild(el)

    const xSet = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' })
    const ySet = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' })
    activeMotesRef.current.push({ el, xSet, ySet })

    const willEscalate = Math.random() < ESCALATE_PROB
    gsap.to(el, {
      left: '44%',
      duration: 2.1 + Math.random() * 0.6,
      ease: 'none',
      onComplete: () => resolveMote(el, yPct, willEscalate),
    })
  }

  function startLine() {
    if (spawnTimer.current) return
    for (let i = 0; i < 5; i += 1) {
      setTimeout(spawnMote, i * 220)
    }
    spawnTimer.current = setInterval(spawnMote, SPAWN_MS)

    flipTimer.current = setInterval(() => {
      const top = cardsRef.current[0]
      if (!top) return
      flipCard(top.el, true)
      setTimeout(() => flipCard(top.el, false), 1500)
    }, 3400)

    counterTimer.current = setInterval(() => {
      statsRef.current.counter += Math.round(Math.random() * 3)
      if (counterRef.current) counterRef.current.textContent = statsRef.current.counter.toLocaleString()
    }, 900)
  }

  function stopLine() {
    clearInterval(spawnTimer.current)
    clearInterval(flipTimer.current)
    clearInterval(counterTimer.current)
    spawnTimer.current = null
    flipTimer.current = null
    counterTimer.current = null
  }

  useEffect(() => updateStatsBar(), [])

  useEffect(() => {
    if (prefersReducedMotion || !sectionRef.current) return undefined

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.aso-word',
        { y: 24, opacity: 0.25 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          stagger: 0.045,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 82%',
            toggleActions: 'play none none reverse',
          },
        }
      )

      gsap.set(chamberRef.current, { opacity: 0, scale: 0.97 })
      gsap.to(chamberRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 72%',
          end: 'top 40%',
          toggleActions: 'play none none reverse',
        },
      })

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 72%',
        end: 'bottom top',
        onEnter: startLine,
        onEnterBack: startLine,
        onLeave: stopLine,
        onLeaveBack: stopLine,
      })
    }, sectionRef)

    return () => {
      ctx.revert()
      stopLine()
    }
  }, [prefersReducedMotion])

  return (
    <section
      id="autonomous-operations"
      ref={sectionRef}
      className="relative overflow-hidden bg-paper py-24 md:py-36"
    >
      <div className="relative z-10 mx-auto max-w-[1500px] px-6 md:px-10">
        {/* HEADER */}
        <div className="max-w-[1150px]">
          <p className="font-mono-tech mb-7 text-xs tracking-[0.2em] text-signal">
            AUTONOMOUS OPERATIONS
          </p>

          <h2 className="max-w-4xl font-sans text-4xl font-bold leading-[0.91] tracking-[-0.05em] text-ink md:text-6xl lg:text-[5.5rem]">
            <Word>Every</Word>{' '}
            <span className="text-signal"><Word>signal</Word></span>
            <br />
            <Word>gets</Word>{' '}
            <Word>a</Word>{' '}
            <span className="text-signal"><Word>decision.</Word></span>
            <br />
            <span className="text-ink/45"><Word>Nothing</Word></span>{' '}
            <span className="text-ink/75"><Word>waits</Word></span>{' '}
            <span className="text-ink/45"><Word>in</Word></span>{' '}
            <span className="text-signal"><Word>line.</Word></span>
          </h2>

          <p className="mt-7 max-w-2xl text-lg leading-[1.55] text-ink/70 md:text-xl">
            SAOM AI doesn&rsquo;t queue work for later. Every signal is judged
            the instant it arrives — cleared back into the noise, or
            crystallized into a case with the reasoning already attached.
          </p>
        </div>

        {/* CHAMBER + LEGEND */}
        <div className="mt-16 grid grid-cols-1 items-start gap-8 md:mt-20 lg:grid-cols-[1fr_300px] lg:gap-10">
          <motion.div
            ref={chamberRef}
            className="relative overflow-hidden rounded-[28px] border border-black/10"
            style={{
              background:
                'radial-gradient(120% 140% at 18% 0%, #242424 0%, #141414 48%, #0a0a0a 100%)',
            }}
          >
            <ParticleField active={!prefersReducedMotion} />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[1] opacity-[0.04]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(180deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)',
              }}
            />

            <div className="absolute left-6 top-6 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 backdrop-blur">
              <motion.span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: RED }}
                animate={
                  prefersReducedMotion ? undefined : { scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }
                }
                transition={{ duration: 1.8, repeat: Infinity }}
              />
              <span className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-white/70">
                Live
              </span>
            </div>

            {/* the line */}
            <motion.div
              ref={fieldRef}
              onMouseMove={handleChamberMouseMove}
              onMouseLeave={handleChamberMouseLeave}
              className="relative z-[5] aspect-[16/11] w-full md:aspect-[16/8]"
              style={
                prefersReducedMotion
                  ? undefined
                  : { perspective: 1600, rotateX, rotateY, transformStyle: 'preserve-3d' }
              }
            >
              <span className="font-mono-tech pointer-events-none absolute left-[44%] top-[8%] z-[6] -translate-x-1/2 -translate-y-6 text-[9px] uppercase tracking-[0.16em] text-white/35">
                Reasoning
              </span>

              <div
                ref={apertureRef}
                aria-hidden="true"
                className="pointer-events-none absolute bottom-[8%] left-[44%] top-[8%] z-[6] w-[2px] transition-[box-shadow] duration-300"
                style={{
                  background: `linear-gradient(180deg, transparent, ${RED}8c 15%, ${RED}8c 85%, transparent)`,
                }}
              >
                <span
                  className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300"
                  style={{
                    border: `1px solid ${RED}${apertureHot ? '80' : '4d'}`,
                    boxShadow: apertureHot
                      ? `0 0 56px 10px ${RED}2e`
                      : `0 0 32px 5px ${RED}1f`,
                    animation: prefersReducedMotion
                      ? 'none'
                      : `aso-ring ${apertureHot ? '1.1s' : '2.4s'} ease-in-out infinite`,
                  }}
                />
              </div>

              <div ref={laneRef} className="absolute inset-0 z-[5]" />

              {/* queue */}
              <div className="absolute bottom-[16%] right-4 top-[16%] z-[9] flex w-[104px] flex-col items-center md:right-6 md:w-[120px]">
                <p className="font-mono-tech mb-2.5 text-center text-[9px] uppercase tracking-[0.16em] text-white/35">
                  Handed off
                </p>
                <div ref={stackRef} className="relative w-full flex-1" />
              </div>
            </motion.div>

            {/* bottom readout */}
            <div className="relative z-[5] flex items-center justify-between border-t border-white/10 px-6 py-4 md:px-10">
              <span className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-white/40">
                Decisions resolved
              </span>
              <span className="font-mono-tech text-sm text-white">
                <span ref={counterRef}>1,204</span>
                <span className="text-white/40"> / hr</span>
              </span>
            </div>
          </motion.div>

          {/* LEGEND */}
          <aside className="lg:pt-4">
            <div className="space-y-8 border-t border-black/10 pt-6 lg:border-t-0 lg:pt-0">
              <div>
                <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink/40">Cleared</p>
                <p className="mt-2 max-w-[220px] text-sm leading-[1.5] text-ink/65">
                  Recognized as ordinary the instant it arrives, and released
                  — it never becomes anyone&rsquo;s problem.
                </p>
              </div>

              <div>
                <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-signal">Escalated</p>
                <p className="mt-2 max-w-[220px] text-sm leading-[1.5] text-ink/65">
                  Reconstructed with its reasoning intact, and handed to your
                  team already explained. Hover a case to open it.
                </p>
              </div>

              <div className="pt-2">
                <div className="flex h-[6px] w-full overflow-hidden rounded-full bg-black/10">
                  <div ref={clearedBarRef} className="h-full bg-ink/25" style={{ width: 0 }} />
                  <div ref={escalatedBarRef} className="h-full bg-signal" style={{ width: 0 }} />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @keyframes aso-ring {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.55; }
          50% { transform: translate(-50%, -50%) scale(1.18); opacity: 0.95; }
        }
        .aso-mote {
          position: absolute;
          width: 34px;
          height: 24px;
          margin-left: -17px;
          margin-top: -12px;
          border-radius: 5px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono-tech, monospace);
          font-size: 9px;
          color: rgba(255,255,255,0.4);
          will-change: transform, opacity, left;
        }
        .aso-reason {
          position: absolute;
          font-family: var(--font-mono-tech, monospace);
          font-size: 10px;
          white-space: nowrap;
          pointer-events: none;
        }
        .aso-reason.is-clear { color: rgba(255,255,255,0.55); }
        .aso-reason.is-escalate { color: ${RED}; }
        .aso-dust {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 999px;
          background: rgba(255,255,255,0.5);
          pointer-events: none;
        }
        .aso-card {
          position: absolute;
          left: 0;
          right: 0;
          height: ${CARD_H}px;
          border-radius: 7px;
          cursor: pointer;
          transform-style: preserve-3d;
        }
        .aso-card-front, .aso-card-back {
          position: absolute;
          inset: 0;
          border-radius: 7px;
          backface-visibility: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 0 8px;
          font-family: var(--font-mono-tech, monospace);
        }
        .aso-card-front {
          background: linear-gradient(135deg, ${RED}e6, ${RED}f2 60%, #b41420f2);
          box-shadow: 0 6px 16px ${RED}40;
          color: #fff;
          font-size: 9px;
          letter-spacing: 0.06em;
        }
        .aso-card-back {
          background: #171717;
          border: 1px solid ${RED}66;
          color: rgba(255,255,255,0.88);
          font-size: 8px;
          line-height: 1.3;
          transform: rotateY(180deg);
        }
        @media (prefers-reduced-motion: reduce) {
          .aso-mote, .aso-reason, .aso-dust { display: none; }
        }
      `}</style>
    </section>
  )
}