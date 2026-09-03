 import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import MagneticButton from './MagneticButton.jsx'
import NetworkField from './NetworkField.jsx'
import { gsap } from 'gsap'
import handImg from '../assets/hand.png'

const line1 = 'From alerts'.split('')
const line2 = 'to answers.'.split('')

function SplitReveal({ chars, delay = 0 }) {
  return (
    <span className="inline-block overflow-hidden">
      {chars.map((c, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ y: '110%' }}
          animate={{ y: '0%' }}
          transition={{
            duration: 0.9,
            delay: delay + i * 0.022,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {c === ' ' ? '\u00A0' : c}
        </motion.span>
      ))}
    </span>
  )
}

export default function Hero() {
  const handRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(handRef.current, {
        yPercent: 12,
        rotate: 3,
        scrollTrigger: {
          trigger: '#top',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
        },
      })
    })

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="top"
      className="relative min-h-[100svh] w-full overflow-hidden bg-paper pt-32 pb-20 md:pt-40"
    >
      {/* Network background */}
      <NetworkField className="pointer-events-auto absolute inset-0 opacity-70" />

      {/* Hand image */}
      <div
        ref={handRef}
        className="pointer-events-none absolute -right-16 top-16 w-[62vw] max-w-[780px] opacity-[0.92] md:-right-6 md:top-8"
        style={{
          maskImage:
            'linear-gradient(to left, black 55%, transparent 96%)',
          WebkitMaskImage:
            'linear-gradient(to left, black 55%, transparent 96%)',
        }}
      >
        <img
          src={handImg}
          alt=""
          className="w-full select-none"
          draggable={false}
        />
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col justify-between px-6 md:px-10">

        {/* HERO CONTENT */}
        <div>

          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.15,
              duration: 0.6,
            }}
            className="font-mono-tech mb-8 flex items-center gap-2 text-xs tracking-[0.14em] text-mute"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
            </span>

            AUTONOMOUS SECURITY OPERATIONS
          </motion.p>

          {/* Main tagline */}
          <h1
            className="max-w-5xl font-sans font-semibold leading-[0.9] tracking-[-0.055em] text-ink"
            style={{
              fontSize: 'clamp(4.5rem, 9vw, 9rem)',
              letterSpacing: '-0.055em',
            }}
          >
            <SplitReveal chars={line1} delay={0.25} />

            <br />

            <span className="text-signal">
              <SplitReveal chars={line2} delay={0.6} />
            </span>
          </h1>

          {/* Supporting text — intentionally close to tagline */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 1.0,
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-3 max-w-xl text-lg leading-[1.45] text-ink/70 md:text-xl"
          >
            SAOM AI acts as an autonomous cybersecurity analyst-
            connecting signals, investigating threats, and explaining what
            matters so your team can respond with clarity.
          </motion.p>

        </div>

        {/* BUTTONS */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 1.25,
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mt-16 flex items-center gap-6 md:mt-20"
        >
          {/* <MagneticButton>
            Request a Demo
          </MagneticButton> */}

          {/* <a
            href="#story"
            className="font-mono-tech text-xs text-mute transition-colors hover:text-ink"
          >
            See how it works ↓
          </a> */}
        </motion.div>

      </div>
    </section>
  )
}