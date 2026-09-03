import { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/**
 * A button that leans toward the cursor within a small radius, and inverts
 * from black-on-white to white-on-black (with a red edge) on hover.
 */
export default function MagneticButton({ children, onClick, variant = 'dark', className = '', as = 'button', href }) {
  const ref = useRef(null)
  const x = useSpring(useMotionValue(0), { stiffness: 200, damping: 20, mass: 0.3 })
  const y = useSpring(useMotionValue(0), { stiffness: 200, damping: 20, mass: 0.3 })

  function handleMove(e) {
    const rect = ref.current.getBoundingClientRect()
    const relX = e.clientX - rect.left - rect.width / 2
    const relY = e.clientY - rect.top - rect.height / 2
    x.set(relX * 0.35)
    y.set(relY * 0.35)
  }

  function handleLeave() {
    x.set(0)
    y.set(0)
  }

  const base =
    variant === 'dark'
      ? 'bg-ink text-paper border border-ink hover:bg-signal hover:border-signal'
      : 'bg-transparent text-ink border border-ink hover:bg-ink hover:text-paper'

  const Comp = as === 'a' ? motion.a : motion.button

  return (
    <Comp
      ref={ref}
      href={href}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x, y }}
      className={`group relative inline-flex items-center gap-3 px-7 py-3.5 text-sm font-medium tracking-wide transition-colors duration-500 ease-signal ${base} ${className}`}
    >
      {children}
    </Comp>
  )
}
