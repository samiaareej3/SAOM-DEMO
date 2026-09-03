import { motion } from 'framer-motion'

const NODES = [
  { x: 60, y: 60 }, { x: 200, y: 40 }, { x: 340, y: 90 }, { x: 120, y: 160 },
  { x: 280, y: 190 }, { x: 420, y: 150 }, { x: 200, y: 250 }, { x: 360, y: 260 },
]
const EDGES = [
  [0, 1], [1, 2], [1, 3], [3, 4], [4, 5], [3, 6], [4, 7], [6, 7],
]

export default function DifferenceSection() {
  return (
    <section id="difference" className="relative border-t border-hair bg-paper py-32 md:py-44">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-16 px-6 md:grid-cols-2 md:px-10">
        <div>
          <p className="font-mono-tech mb-6 text-xs text-signal">02 — The SAOM AI Difference</p>
          <h2 className="text-display-sm font-semibold leading-[0.98] text-ink">
            It doesn't just flag events.
            <br />
            It connects them.
          </h2>
          <p className="mt-8 max-w-md text-lg leading-relaxed text-ink/70">
            A login from an unfamiliar location. A new admin role. A quiet
            transfer of data at 3am. On their own, none of these trigger
            urgency. Together, they're an attack. SAOM AI builds that context
            automatically, in real time, across every system it watches.
          </p>
        </div>

        <div className="relative flex items-center justify-center">
          <svg viewBox="0 0 480 320" className="w-full max-w-[480px]">
            {EDGES.map(([a, b], i) => (
              <motion.line
                key={i}
                x1={NODES[a].x} y1={NODES[a].y}
                x2={NODES[b].x} y2={NODES[b].y}
                stroke="#0a0a0a" strokeOpacity={0.18} strokeWidth={1}
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.9, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              />
            ))}
            {NODES.map((n, i) => (
              <motion.circle
                key={i}
                cx={n.x} cy={n.y} r={i === 6 ? 8 : 5}
                fill={i === 6 ? '#e4002b' : '#0a0a0a'}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              />
            ))}
          </svg>
          <span className="font-mono-tech absolute bottom-0 right-0 text-xs text-signal">
            attack path resolved
          </span>
        </div>
      </div>
    </section>
  )
}
