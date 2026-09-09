 import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
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
        yPercent: 5,
        rotate: -2,

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
      className="
        relative
        min-h-[100svh]
        w-full
        overflow-hidden
        bg-paper
        pt-32
        pb-20
        md:pt-40
      "
    >

      {/* =====================================
          NETWORK BACKGROUND
      ====================================== */}
      <NetworkField
        className="
          pointer-events-auto
          absolute
          inset-0
          opacity-70
        "
      />

      {/* =====================================
          HAND
          The wrist intentionally enters from
          outside the right edge.
      ====================================== */}
      <div
        ref={handRef}
        className="
          pointer-events-none
          absolute
          -right-[13vw]
          top-[13vh]
          z-[1]
          w-[72vw]
          max-w-[950px]
          opacity-[0.94]

          md:-right-[11vw]
          md:top-[12vh]
        "
        style={{
          transform: 'rotate(-4deg)',

          maskImage:
            'linear-gradient(to left, black 58%, transparent 98%)',

          WebkitMaskImage:
            'linear-gradient(to left, black 58%, transparent 98%)',
        }}
      >
        <img
          src={handImg}
          alt=""
          className="
            block
            w-full
            select-none
          "
          draggable={false}
        />
      </div>

      {/* =====================================
          HERO CONTENT
      ====================================== */}
      <div
        className="
          relative
          z-10
          mx-auto
          flex
          h-full
          max-w-[1400px]
          flex-col
          justify-between
          px-6
          md:px-10
        "
      >

        <div>

          {/* =====================================
              EYEBROW
          ====================================== */}
          <motion.p
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.15,
              duration: 0.6,
            }}
            className="
              font-mono-tech
              mb-8
              flex
              items-center
              gap-2
              text-xs
              tracking-[0.14em]
              text-mute
            "
          >
            <span className="relative flex h-1.5 w-1.5">

              <span
                className="
                  absolute
                  inline-flex
                  h-full
                  w-full
                  animate-ping
                  rounded-full
                  bg-signal
                  opacity-75
                "
              />

              <span
                className="
                  relative
                  inline-flex
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-signal
                "
              />

            </span>

            AUTONOMOUS SECURITY OPERATIONS
          </motion.p>

          {/* =====================================
              MAIN HEADLINE
          ====================================== */}
          <h1
            className="
              max-w-5xl
              font-sans
              font-semibold
              leading-[0.9]
              tracking-[-0.055em]
              text-ink
            "
            style={{
              fontSize: 'clamp(4.5rem, 9vw, 9rem)',
              letterSpacing: '-0.055em',
            }}
          >

            <SplitReveal
              chars={line1}
              delay={0.25}
            />

            <br />

            <span className="text-signal">
              <SplitReveal
                chars={line2}
                delay={0.6}
              />
            </span>

          </h1>

          {/* =====================================
              DESCRIPTION
          ====================================== */}
          <motion.p
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 1.0,
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="
              mt-3
              max-w-xl
              text-lg
              leading-[1.45]
              text-ink/70
              md:text-xl
            "
          >
            SAOM AI acts as an autonomous cybersecurity analyst-
            connecting signals, investigating threats, and explaining what
            matters so your team can respond with clarity.
          </motion.p>

        </div>

        {/* =====================================
            BUTTON AREA
        ====================================== */}
        <motion.div
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 1.25,
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="
            mt-16
            flex
            items-center
            gap-6
            md:mt-20
          "
        />

      </div>

    </section>
  )
}