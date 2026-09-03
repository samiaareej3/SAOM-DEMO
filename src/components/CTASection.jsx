import { motion } from 'framer-motion'
import MagneticButton from './MagneticButton.jsx'

export default function CTASection() {
  return (
    <section className="relative overflow-hidden bg-ink py-40 text-paper md:py-52">
      <div className="pointer-events-none absolute inset-0">
        <span className="absolute left-[8%] top-[20%] h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
        <span className="absolute right-[14%] top-[65%] h-1 w-1 animate-pulse rounded-full bg-signal" style={{ animationDelay: '0.6s' }} />
        <span className="absolute left-[42%] bottom-[12%] h-1 w-1 animate-pulse rounded-full bg-signal" style={{ animationDelay: '1.2s' }} />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 text-center md:px-10">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-display-sm font-semibold leading-[1.02]"
        >
          Your systems never stop.
          <br />
          Neither should your security.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 flex flex-col items-center gap-6"
        >
          <MagneticButton variant="light" className="!border-paper !text-paper hover:!bg-signal hover:!border-signal hover:!text-paper !bg-transparent">
            Request Early Access
          </MagneticButton>
          <p className="font-mono-tech text-xs text-paper/50">Meet SAOM AI.</p>
        </motion.div>
      </div>
    </section>
  )
}
