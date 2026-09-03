 import { useState } from 'react'

const CARDS = [
  {
    number: '01',
    label: 'NOISE',
    title: 'Alert fatigue.',
    description:
      'Thousands of alerts, logs and events arrive every day — most meaningless on their own, but each demanding attention.',
  },
  {
    number: '02',
    label: 'FRAGMENTATION',
    title: 'Scattered signals.',
    description:
      'The pieces of an attack are spread across endpoints, identities, networks, cloud services and disconnected security tools.',
  },
  {
    number: '03',
    label: 'CONCEALMENT',
    title: 'Hidden sequences.',
    description:
      'The real attack path is buried inside ordinary-looking activity, making the connections difficult to see.',
  },
  {
    number: '04',
    label: 'COST',
    title: 'Analyst overload.',
    description:
      'Security teams spend valuable hours manually connecting signals that should already make sense together.',
  },
]

export default function ProblemSection() {
  const [hoveredCard, setHoveredCard] = useState(null)

  return (
     <section
  id="problem"
  className="relative overflow-hidden bg-paper pt-20 pb-28 md:pt-24 md:pb-36"
>
      <div className="relative z-10 mx-auto max-w-[1400px] px-6 md:px-10">

        {/* INTRO */}
        <div className="max-w-[1150px]">

          <p className="font-mono-tech mb-7 text-xs tracking-[0.2em] text-signal">
            01 — THE PROBLEM
          </p>

          <h2 className="max-w-5xl font-sans text-4xl font-semibold leading-[0.94] tracking-[-0.045em] text-ink md:text-6xl lg:text-[5.5rem]">
            The problem isn't detection.
            <br />
            <span className="text-ink/45">
              It's everything after it.
            </span>
          </h2>

          <p className="mt-7 max-w-3xl text-lg leading-[1.55] text-ink/70 md:text-xl">
            Modern environments generate thousands of security signals every
            day. The attack is rarely missing from the data — it is buried
            inside it, scattered across systems, tools and timelines.
          </p>

        </div>

        {/* PROBLEM CARDS */}
         <div className="mt-16 grid grid-cols-1 gap-5 md:mt-20 md:grid-cols-2">
          {CARDS.map((card, index) => {
            const isHovered = hoveredCard === index

            return (
              <article
                key={card.number}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                className="group relative min-h-[300px] overflow-hidden rounded-[26px] border bg-paper p-8 transition-all duration-500 ease-out md:p-10 lg:min-h-[340px]"
                style={{
                  borderColor: isHovered
                    ? '#e4002b'
                    : 'rgba(228, 0, 43, 0.42)',

                  transform: isHovered
                    ? 'translateY(-7px)'
                    : 'translateY(0)',

                  boxShadow: isHovered
                    ? '0 20px 50px rgba(228, 0, 43, 0.09)'
                    : '0 0 0 rgba(0,0,0,0)',
                }}
              >

                {/* Hover glow */}
                <div
                  className="pointer-events-none absolute -right-24 -top-24 h-52 w-52 rounded-full bg-signal/10 blur-3xl transition-opacity duration-500"
                  style={{
                    opacity: isHovered ? 1 : 0,
                  }}
                />

                {/* CARD HEADER */}
                <div className="relative z-10 flex items-start justify-between">

                  <p className="font-mono-tech text-xs tracking-[0.2em] text-signal">
                    {card.label}
                  </p>

                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full border text-xs font-medium transition-all duration-500"
                    style={{
                      borderColor: isHovered
                        ? '#e4002b'
                        : 'rgba(228, 0, 43, 0.42)',

                      color: isHovered
                        ? '#e4002b'
                        : '#0a0a0a',

                      transform: isHovered
                        ? 'rotate(8deg) scale(1.08)'
                        : 'rotate(0deg) scale(1)',
                    }}
                  >
                    {card.number}
                  </span>

                </div>

                {/* CARD CONTENT */}
                <div className="relative z-10 mt-16 md:mt-20">

                  <h3
                    className="font-sans text-3xl font-semibold leading-[0.95] tracking-[-0.04em] text-ink transition-transform duration-500 md:text-4xl lg:text-5xl"
                    style={{
                      transform: isHovered
                        ? 'translateX(6px)'
                        : 'translateX(0)',
                    }}
                  >
                    {card.title}
                  </h3>

                  <p className="mt-6 max-w-lg text-base leading-[1.55] text-ink/65 md:text-lg">
                    {card.description}
                  </p>

                </div>

                {/* RED HOVER LINE */}
                <div
                  className="absolute bottom-0 left-0 h-[3px] bg-signal transition-all duration-500"
                  style={{
                    width: isHovered ? '100%' : '0%',
                  }}
                />

              </article>
            )
          })}

        </div>

      </div>
    </section>
  )
}